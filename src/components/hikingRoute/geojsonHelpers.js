// egy vágott feature id-jéből (pl. "way123_a_b") visszafejti az eredeti (OSM) alap-id-t
// és a vágási "útvonalat" (melyik fél volt melyik lépésnél): { baseId: "way123", parts: ["1","2"] }
function splitCutSuffixes(id) {
  const parts = [];
  let current = String(id);
  while (true) {
    const match = /^(.+)_(a|b)$/.exec(current);
    if (!match) break;
    parts.unshift(match[2] === 'a' ? '1' : '2');
    current = match[1];
  }
  return { baseId: current, parts };
}

// szép, olvasható megjelenítési label egy (esetleg vágott) feature id-ból.
// nem vágott way: "way123" -> "way123"
// egyszer vágott: "way123_a" -> "way123 (1)"
// kétszer vágott (az egyik felet még egyszer elvágtuk): "way123_a_b" -> "way123 (1.2)"
function formatOriginalId(id) {
  const { baseId, parts } = splitCutSuffixes(id);
  return parts.length === 0 ? baseId : `${baseId} (${parts.join('.')})`;
}

export function injectIds(geojson) {
  return {
    ...geojson,
    features: geojson.features.map((f, index) => {
      const rawId = f.id ?? f.properties?.id;
      return {
        ...f,
        properties: {
          ...f.properties,
          uid: index,              // numerikus, vector tile-kompatibilis
          originalId: formatOriginalId(rawId)  // szép, olvasható label - vágott darabnál is
        }
      };
    })
  };
}

// egy LineString koordináta-tömböt vág ketté a megadott (belso) vertex-indexen.
// a vágási pont mindkét darabban szerepel, hogy ne legyen rés a vonalban.
function splitLineString(coords, pointIndex) {
  const firstCoords = coords.slice(0, pointIndex + 1);
  const secondCoords = coords.slice(pointIndex);
  return [firstCoords, secondCoords];
}

export function applyEdit(geojson, edit) {
  return {
    ...geojson,
    // az elsődleges azonosító a feature.id (OSM eredetű); a properties.uid csak a
    // MapLibre kattintáskezeléshez injektált belső mező, edit-matchinghez NEM használjuk
    features: geojson.features.flatMap((f) => {
      if (f.id !== edit.featureId) return [f];

      if (edit.type === 'SET_VISITED') {
        const prevDates = f.properties.visitedDates ?? [];
        const date = edit.payload.date;

        // duplikátum elkerülése: ha ugyanaz a dátum már szerepel, nem adjuk hozzá újra
        const nextDates = date && !prevDates.includes(date)
          ? [...prevDates, date]
          : prevDates;

        return [{
          ...f,
          properties: {
            ...f.properties,
            visited: edit.payload.visited,
            visitedDates: nextDates
          }
        }];
      }

      if (edit.type === 'CUT_WAY') {
        const { pointIndex } = edit.payload;
        const coords = f.geometry?.coordinates;

        const isValidSplit =
          f.geometry?.type === 'LineString' &&
          Array.isArray(coords) &&
          pointIndex > 0 &&
          pointIndex < coords.length - 1;

        if (!isValidSplit) {
          // érvénytelen vágási pont (végpont, vagy nem LineString): nincs mit tenni,
          // a feature változatlanul megmarad
          return [f];
        }

        const [firstCoords, secondCoords] = splitLineString(coords, pointIndex);

        // az eredeti OSM id-ből képzünk két ÚJ, egymástól és mindentől eltérő id-t.
        // fontos: ez determinisztikus (mindig ugyanaz a bemenetre), mert a mergedGeojson
        // minden renderkor újraszámolódik a baseGeojson-ból (applyAllEdits reduce)
        const firstId = `${f.id}_a`;
        const secondId = `${f.id}_b`;

        const baseProps = {
          ...f.properties,
          parentId: f.id,
          parentOriginalId: f.properties.originalId,
        };

        const firstFeature = {
          ...f,
          id: firstId,
          properties: {
            ...baseProps,
            uid: `${f.properties.uid}_a`,
            // ugyanaz a formázó logika, mint az injectIds-ben - nested vágásnál is
            // konzisztens marad (pl. "way123 (1.2)"), nincs string-konkatenációs duplázódás
            originalId: formatOriginalId(firstId)
          },
          geometry: { type: 'LineString', coordinates: firstCoords }
        };

        const secondFeature = {
          ...f,
          id: secondId,
          properties: {
            ...baseProps,
            uid: `${f.properties.uid}_b`,
            originalId: formatOriginalId(secondId)
          },
          geometry: { type: 'LineString', coordinates: secondCoords }
        };

        return [firstFeature, secondFeature];
      }

      return [f];
    })
  };
}

// Az összes elmentett lépést sorban lefuttatja egy geojson-on
export function applyAllEdits(geojson, edits) {
  return edits.reduce((acc, edit) => applyEdit(acc, edit), geojson);
}

// Ellenőrzi, hogy a végső geojson tartalmazza-e az összes SET_VISITED módosítást
// (egyszerű konzisztencia-check: minden edit a logban tényleg megjelenik-e a feature-ben)
export function validateGeojsonAgainstEdits(geojson, edits) {
  const byFeature = new Map(geojson.features.map((f) => [f.id, f]));
  const problems = [];

  // featureId szerint csoportosítjuk az edit-eket, hogy tudjuk mi az adott feature
  // UTOLSÓ visited állapota, és mely dátumoknak KELL szerepelniük a tömbben
  const byFeatureEdits = new Map();
  for (const edit of edits) {
    if (edit.type !== 'SET_VISITED') continue;
    if (!byFeatureEdits.has(edit.featureId)) byFeatureEdits.set(edit.featureId, []);
    byFeatureEdits.get(edit.featureId).push(edit);
  }

  // featureId -> [firstHalfId, secondHalfId], a CUT_WAY edit-ek alapján.
  // ez kell ahhoz, hogy egy időközben elvágott feature-t a leszármazottjain
  // (akár többszörös, egymást követő vágás esetén a leszármazottak
  // leszármazottjain) tudjunk ellenőrizni, ahelyett hogy hibásan
  // "hiányzó feature"-t jeleznénk egy SET_VISITED utáni CUT_WAY miatt.
  const cutSuccessors = new Map();
  for (const edit of edits) {
    if (edit.type !== 'CUT_WAY') continue;
    cutSuccessors.set(edit.featureId, [`${edit.featureId}_a`, `${edit.featureId}_b`]);
  }

  // egy featureId-ból eljut az összes ténylegesen létező "levél" feature-ig:
  // ha a feature nincs elvágva, ő maga a levél; ha el van vágva, a két fele
  // (rekurzívan, ha azok is el lettek vágva később egy soron következő edit által).
  function resolveLeafIds(featureId, seen = new Set()) {
    if (seen.has(featureId)) return []; // védelem esetleges hibás/ciklikus edit-log ellen
    seen.add(featureId);

    if (byFeature.has(featureId)) return [featureId];

    const successors = cutSuccessors.get(featureId);
    if (!successors) return []; // ténylegesen hiányzik, erre nincs magyarázat

    return successors.flatMap((id) => resolveLeafIds(id, seen));
  }

  for (const [featureId, featureEdits] of byFeatureEdits) {
    const leafIds = resolveLeafIds(featureId);

    if (leafIds.length === 0) {
      // sem maga a feature, sem egy vágás utáni leszármazottja nem található -
      // ez tényleges hiba (pl. törölt adat vagy korrupt edit-log)
      problems.push(`Hiányzó feature: ${featureId}`);
      continue;
    }

    // az utolsó edit adja a végleges 'visited' állapotot, amit MINDEN
    // (esetlegesen vágás utáni) leszármazottnak örökölnie kellett a CUT_WAY-kor
    const lastEdit = featureEdits[featureEdits.length - 1];
    const expectedDates = [...new Set(featureEdits.map((e) => e.payload.date).filter(Boolean))];

    for (const leafId of leafIds) {
      const feature = byFeature.get(leafId);

      if (feature.properties.visited !== lastEdit.payload.visited) {
        problems.push(`Eltérés visited mezőben: ${leafId}${leafId !== featureId ? ` (eredeti: ${featureId})` : ''}`);
      }

      const actualDates = feature.properties.visitedDates ?? [];
      const missing = expectedDates.filter((d) => !actualDates.includes(d));
      if (missing.length > 0) {
        problems.push(
          `Hiányzó dátum(ok) a visitedDates mezőben: ${leafId}${leafId !== featureId ? ` (eredeti: ${featureId})` : ''} (${missing.join(', ')})`
        );
      }
    }
  }

  // CUT_WAY edit-ek ellenőrzése: minden vágásnak ténylegesen le kellett futnia,
  // azaz az eredeti id-nak el kell tűnnie, és a két új "_a"/"_b" félnek (VAGY,
  // ha azokat egy KÉSŐBBI edit tovább vágta, azok leszármazottjainak) létre kell jönniük.
  // a resolveLeafIds-t használjuk itt is, mert egy fél maga is elvágható egy soron
  // következő CUT_WAY edittel - ilyenkor "${id}_a" közvetlenül már nem létezik, csak a
  // leszármazottjai (pl. "${id}_a_a"/"${id}_a_b"), ami nem jelenti azt, hogy az EREDETI
  // vágás sikertelen volt.
  // ha ez nem így van (pl. érvénytelen pointIndex miatt csendben no-op volt az applyEdit),
  // azt itt buktatjuk el feltöltés előtt, ne szinkronizáljunk hamis állapotot.
  for (const edit of edits) {
    if (edit.type !== 'CUT_WAY') continue;

    const stillExists = byFeature.has(edit.featureId);
    const firstHalfLeaves = resolveLeafIds(`${edit.featureId}_a`);
    const secondHalfLeaves = resolveLeafIds(`${edit.featureId}_b`);

    if (stillExists || firstHalfLeaves.length === 0 || secondHalfLeaves.length === 0) {
      problems.push(
        `Sikertelen vágás: ${edit.featureId} (pointIndex: ${edit.payload?.pointIndex}) - ` +
        `ellenőrizd, hogy a vágási pont belső vertex volt-e, és a way még létezett-e a vágáskor.`
      );
    }
  }

  return { valid: problems.length === 0, problems };
}

// eltávolítja a kizárólag kliensoldali / derivált segédmezőket a feltöltött payload-ból.
// "uid": MapLibre kattintáskezeléshez injektálva. "parentId"/"parentOriginalId": vágás-nyomkövetés.
// "originalId": derivált, az injectIds úgyis újraszámolja letöltéskor a feature.id-ból.
// CSAK a feltöltött payload-on hívjuk - a helyi state/IndexedDB-ben ezekre a mezőkre
// a következő letöltésig továbbra is szüksége van a UI-nak, ott NEM szabad eltávolítani.
export function stripInternalFields(geojson) {
  return {
    ...geojson,
    features: geojson.features.map((f) => {
      const { uid, parentId, parentOriginalId, originalId, ...rest } = f.properties;
      return { ...f, properties: rest };
    })
  };
}

export function isToday(dateString) {
  if (!dateString) return false;
  const d = new Date(dateString);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}