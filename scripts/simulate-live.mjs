#!/usr/bin/env node
//
// scripts/simulate-live.mjs
//
// GPX fájlból "élő" koordinátákat küld a Locus-beviteli Supabase Edge
// Function-nek, PONTOSAN úgy, ahogy a valódi Locus app tenné (ugyanaz a
// form-urlencoded POST, ugyanazok a mezők) - így az /live oldal a teljes,
// éles adatfolyamot kapja végponttól végpontig, nem egy megkerülő úton
// beszúrt tesztadatot.
//
// NULLA külső függőség: csak Node beépített modulokat és a globális
// fetch-et használja (Node 18+).
//
// ─────────────────────────────────────────────────────────────────────────
// HASZNÁLAT
// ─────────────────────────────────────────────────────────────────────────
//
//   node scripts/simulate-live.mjs \
//     --gpx=tura.gpx \
//     --url=http://127.0.0.1:54321/functions/v1/live-ingest \
//     --user=Robi \
//     --interval=3000 \
//     --key=$LOCUS_KEY \
//     --simplify=0.00005
//
// PARAMÉTEREK:
//   --gpx        (kötelező) a GPX fájl elérési útja (hiking szakasz)
//   --gpx2       opcionális MÁSODIK GPX fájl - ha megadod, a két track közé
//                (az első track UTOLSÓ és a második track ELSŐ pontja közé)
//                egyenesre illesztett, szimulált "car" pontok kerülnek
//   --carPoints  hány közbenső "car" pont legyen a --gpx és --gpx2 között
//                (alapértelmezett: 5, csak --gpx2 esetén számít)
//   --url        (kötelező) az Edge Function URL-je (helyi VAGY éles)
//   --user       (kötelező) a live_users.user mező értéke (pl. "anna")
//   --key        a userhez tartozó live_users.key - VAGY add meg a LIVE_KEY
//                környezeti változóban, hogy ne kerüljön a shell historyba
//   --interval   ms, két pont küldése között (alapértelmezett: 3000)
//   --mode       a hiking szakaszok mode-ja (alapértelmezett: "hiking")
//   --drop       0..1 - ennyi eséllyel dobunk el egy pontot, hogy a
//                Realtime-kiesést és a pótló újralekérdezést teszteljük
//                (alapértelmezett: 0, azaz nincs kihagyás)
//   --dryRun     ha jelen van, NEM küld hálózati kérést, csak kiírja,
//                mit küldene - így a GPX-beolvasás/időzítés próbálható ki
//                kockázat nélkül, mielőtt bármi ténylegesen kimegy
//   --simplify   gpx koordináták csökkentése érdekében az útvonal egyszerűsítésre
//                kerül turf/simplify segítségével0.00005
//
// PÉLDA - két hiking szakasz, köztük 5 "car" ponttal:
//   node scripts/simulate-live.mjs \
//     --gpx=matra_1resz.gpx --gpx2=matra_2resz.gpx --carPoints=5 \
//     --url=https://xxxx.supabase.co/functions/v1/live-ingest \
//     --user=Robi --interval=3000
//
// FONTOS: a --url-t ELŐSZÖR érdemes helyi (supabase functions serve) címre
// állítani, ne az éles projektre - így nem mennek ki valós emailek, és
// nem szennyeződik az éles live_coordinates tábla teszteléskor.
//
// A --key mostantól a live_users.key mező értéke (userenként egyedi - NEM egy
// globális, mindenki által megosztott titok). Add meg inkább környezeti
// változóként, mint parancssori kapcsolóként, hogy ne maradjon a shell
// history-ban:
//   LIVE_KEY=a-user-sajat-kulcsa node scripts/simulate-live.mjs --gpx=... --url=... --user=...
//
// ─────────────────────────────────────────────────────────────────────────

import { readFileSync } from 'node:fs';
import simplify from '@turf/simplify';

function parseArgs(argv) {
  const args = {};
  for (const raw of argv.slice(2)) {
    if (raw === '--dryRun') { args.dryRun = true; continue; }
    const m = raw.match(/^--([^=]+)=(.*)$/);
    if (m) args[m[1]] = m[2];
  }
  console.log(args);
  return args;
}

/**
 * Egyszerűsíti egy GPX-ből beolvasott pontlistát Turf simplify segítségével.
 */
function simplifyTrack(points, tolerance) {
  if (!points || points.length < 3) {
    return points;
  }

  const line = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: points.map((p) => [p.lng, p.lat]),
    },
  };

  const simplified = simplify(line, {
    tolerance,
    highQuality: true,
    mutate: false,
  });

  const result = simplified.geometry.coordinates.map(([lng, lat]) => ({
    lat,
    lng,
  }));

  console.log(
    `Track egyszerűsítve: ${points.length} → ${result.length} pont (${(
      (result.length / points.length) *
      100
    ).toFixed(1)}%)`
  );

  return result;
}

// Egyszerű, függőség nélküli GPX-parser. Az attribútum-sorrendet (lat/lon)
// nem feltételezi fixnek, ezért a legtöbb valós exportált GPX-szel (Locus,
// Strava, OsmAnd, stb.) működik.
//
// Az időbélyeget SZÁNDÉKOSAN nem olvassuk ki/használjuk: a GPX-ben lévő
// <time> egy régi, archív túra időpontja, ami élő közvetítés teszteléséhez
// félrevezető lenne. A küldéskor mindig az AKTUÁLIS időt használjuk (lásd
// sendPoint), ahogy egy valódi élő eszköz is tenné.
function parseGpx(xmlText) {
  const points = [];
  const trkptRegex = /<trkpt\b([^>]*)>/g;
  let match;

  while ((match = trkptRegex.exec(xmlText))) {
    const attrs = match[1];

    const lat = parseFloat(attrs.match(/lat="([^"]+)"/)?.[1]);
    const lng = parseFloat(attrs.match(/lon="([^"]+)"/)?.[1]);
    if (Number.isNaN(lat) || Number.isNaN(lng)) continue;

    points.push({ lat, lng });
  }

  return points;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Egyenesre illesztett, lineárisan interpolált pontok "a" és "b" KÖZÖTT
// (a végpontokat NEM tartalmazza) - ezt a két hiking-track közötti szimulált
// autós szakaszhoz használjuk.
function interpolate(a, b, count) {
  const points = [];
  for (let i = 1; i <= count; i++) {
    const t = i / (count + 1);
    points.push({
      lat: a.lat + (b.lat - a.lat) * t,
      lng: a.lng + (b.lng - a.lng) * t,
    });
  }
  return points;
}

async function sendPoint({ url, key, user, point }) {
  const body = new URLSearchParams({
    lat: String(point.lat),
    lng: String(point.lng),
    user,
    key,
    mode: point.mode,
    // MINDIG az aktuális idő megy, NEM a GPX archív időbélyege - egy élő
    // eszköz is a saját "most" idejét küldené, nem egy régi túra óráját.
    locusTime: String(Date.now()),
  });

  const res = await fetch(url, { method: 'POST', body });
  const text = await res.text();
  return { status: res.status, text };
}

async function main() {
  const args = parseArgs(process.argv);
  const key = args.key ?? process.env.LIVE_KEY;

  const missing = ['gpx', 'url', 'user'].filter((k) => !args[k]);
  if (!key) missing.push('key (vagy LIVE_KEY env változó)');

  if (missing.length) {
    console.error(`Hiányzó paraméter(ek): ${missing.join(', ')}`);
    console.error(
      'Példa: node scripts/simulate-live.mjs --gpx=tura.gpx --url=http://127.0.0.1:54321/functions/v1/live-ingest --user=Robi'
    );
    process.exit(1);
  }

  const interval = Number(args.interval ?? 3000);
  const hikingMode = args.mode ?? 'hiking';
  const carPointCount = Number(args.carPoints ?? 5);
  const dropRate = Number(args.drop ?? 0);
  const dryRun = Boolean(args.dryRun);

  let track1 = parseGpx(readFileSync(args.gpx, 'utf-8'));
  if (args.simplify) {
    track1 = simplifyTrack(track1, Number(args.simplify));
  }
  if (track1.length === 0) {
    console.error(`Nem találtam <trkpt> pontot ebben a fájlban: ${args.gpx}`);
    process.exit(1);
  }

  // pontonkénti mode-dal ellátott, végleges küldési sorrend összeállítása
  let points = track1.map((p) => ({ ...p, mode: hikingMode }));

  if (args.gpx2) {
    let track2 = parseGpx(readFileSync(args.gpx2, 'utf-8'));

    if (args.simplify) {
        track2 = simplifyTrack(track2, Number(args.simplify));
    }
    if (track2.length === 0) {
      console.error(`Nem találtam <trkpt> pontot ebben a fájlban: ${args.gpx2}`);
      process.exit(1);
    }

    const lastOfTrack1 = track1[track1.length - 1];
    const firstOfTrack2 = track2[0];
    const carSegment = interpolate(lastOfTrack1, firstOfTrack2, carPointCount)
      .map((p) => ({ ...p, mode: 'car' }));

    points = [
      ...points,
      ...carSegment,
      ...track2.map((p) => ({ ...p, mode: hikingMode })),
    ];

    console.log(
      `2 track összefűzve: ${track1.length} hiking pont + ` +
      `${carSegment.length} interpolált car pont + ${track2.length} hiking pont.`
    );
  }

  console.log(
    `${points.length} pont összesen. Küldés indul ` +
    `(${interval}ms/pont, drop=${dropRate}${dryRun ? ', DRY RUN' : ''})...`
  );

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const label = `[${i + 1}/${points.length}] mode=${point.mode} ${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;

    if (dropRate > 0 && Math.random() < dropRate) {
      console.log(`${label} - KIHAGYVA (szimulált kiesés)`);
    } else if (dryRun) {
      console.log(`${label} - (dry run, nincs valódi küldés) locusTime=most`);
    } else {
      try {
        const { status, text } = await sendPoint({ url: args.url, key, user: args.user, point });
        console.log(`${label} - ${status}${status !== 200 ? ' -> ' + text : ''}`);
      } catch (err) {
        console.error(`${label} - HIBA: ${err.message}`);
      }
    }

    if (i < points.length - 1) await sleep(interval);
  }

  console.log('Kész.');
}

main();
