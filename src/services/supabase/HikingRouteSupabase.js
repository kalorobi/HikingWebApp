import { supabase } from "../SupabaseClient";
import logger from "../../utils/Logger";

const log = logger.scope("HikigRouteSupabase");

const BUCKET = 'hikingRoute';

// A fájlok hegységenként külön prefix (mappa) alatt vannak a bucketben:
//
//   Matra/latest.geojson
//   Matra/20260803_Matra.geojson
//   Bukk/latest.geojson
//   ...
//
// A `region` a hegység Storage-beli neve (lásd utils/mountains.js), nem az
// URL-ben használt id - ezért adjuk át kívülről, ne itt fejtsük vissza.
function latestPath(region) {
  return `${region}/latest.geojson`;
}

// ÉÉÉÉHHNN formátumú dátumbélyeg (nap-pontosságú, óra/perc nélkül) - tehát ha
// egy napon belül többször mentünk, az adott nap pillanatképe a nap UTOLSÓ
// mentésének állapotát fogja tükrözni (upsert felülírja). Ha később mentésenkénti
// (nem csak napi) történetre lenne szükség, ide órát/percet/másodpercet is
// bele kell venni a stamp-be.
function buildSnapshotPath(region, date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  return `${region}/${stamp}_${region}.geojson`;
}

export async function downloadGeojson(region) {
  if (!region) throw new Error('downloadGeojson: hiányzó region paraméter.');

  const path = latestPath(region);
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error) {
    log.error(`Download error (${path})`, error);
    throw error;
  }
  const text = await data.text();
  log.info(`Geojson was downloaded (${path})`);
  return JSON.parse(text);
}

export async function uploadGeojson(region, geojson) {
  if (!region) throw new Error('uploadGeojson: hiányzó region paraméter.');

  const blob = new Blob([JSON.stringify(geojson)], { type: 'application/json' });

  // 1) <region>/latest.geojson felülírása - ez marad a "jelenlegi állapot" gyors
  //    elérési útja, amit a downloadGeojson (sync elején) is használ
  const latestFilePath = latestPath(region);
  const { error: latestError } = await supabase.storage
    .from(BUCKET)
    .upload(latestFilePath, blob, { upsert: true, contentType: 'application/json' });
  if (latestError) {
    log.error(`Upload latest error (${latestFilePath})`, latestError);
    throw latestError;
  }

  // 2) dátumozott pillanatkép mentése (pl. "Matra/20260803_Matra.geojson"), hogy a
  //    korábbi állapotok megmaradjanak visszakereshető/visszaállítható formában,
  //    amíg az adatbázis-alapú tárolásra át nem álltok
  const snapshotFilePath = buildSnapshotPath(region);
  const { error: snapshotError } = await supabase.storage
    .from(BUCKET)
    .upload(snapshotFilePath, blob, { upsert: true, contentType: 'application/json' });
  if (snapshotError) {
    log.error(`Upload ${snapshotFilePath} error`, snapshotError);
    throw snapshotError;
  }

  log.info(`Geojson was uploaded (${latestFilePath}, ${snapshotFilePath})`);
}