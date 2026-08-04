import { supabase } from "../SupabaseClient";

const BUCKET = 'hikingRoute';
const FILE_PATH = 'latest.geojson';

// Egyelőre csak a Mátra régió van feldolgozva (lásd Home.jsx "MATRA52"), ezért
// ez egyszerű konstans - ha később több régió lesz, ez paraméterré alakítható
// (pl. a geojson-t régiónként külön bucketben/prefixben tárolva).
const REGION_NAME = 'Matra';

// ÉÉÉÉHHNN formátumú dátumbélyeg (nap-pontosságú, óra/perc nélkül) - tehát ha
// egy napon belül többször mentünk, az adott nap pillanatképe a nap UTOLSÓ
// mentésének állapotát fogja tükrözni (upsert felülírja). Ha később mentésenkénti
// (nem csak napi) történetre lenne szükség, ide órát/percet/másodpercet is
// bele kell venni a stamp-be.
function buildSnapshotFileName(regionName = REGION_NAME, date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  return `${stamp}_${regionName}.geojson`;
}

export async function downloadGeojson() {
  const { data, error } = await supabase.storage.from(BUCKET).download(FILE_PATH);
  if (error) throw error;
  const text = await data.text();
  return JSON.parse(text);
}

export async function uploadGeojson(geojson) {
  const blob = new Blob([JSON.stringify(geojson)], { type: 'application/json' });

  // 1) latest.geojson felülírása - ez marad a "jelenlegi állapot" gyors elérési útja,
  //    amit a downloadGeojson (sync elején) is használ
  const { error: latestError } = await supabase.storage
    .from(BUCKET)
    .upload(FILE_PATH, blob, { upsert: true, contentType: 'application/json' });
  if (latestError) throw latestError;

  // 2) dátumozott pillanatkép mentése (pl. "20260803_Matra.geojson"), hogy a
  //    korábbi állapotok megmaradjanak visszakereshető/visszaállítható formában,
  //    amíg az adatbázis-alapú tárolásra át nem álltok
  const snapshotFileName = buildSnapshotFileName();
  const { error: snapshotError } = await supabase.storage
    .from(BUCKET)
    .upload(snapshotFileName, blob, { upsert: true, contentType: 'application/json' });
  if (snapshotError) throw snapshotError;
}