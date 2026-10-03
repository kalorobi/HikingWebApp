// Az alkalmazás által ismert hegységek.
//
// - kulcs / id : ez jelenik meg az URL-ben (/hikingRoute/:mountain) és ez az
//                IndexedDB kulcs is (geojsonStore.id, editLog.mountain)
// - region     : a Supabase Storage-ban használt mappa/fájlnév-prefix
//                (pl. "Matra/latest.geojson", "Matra/20260803_Matra.geojson")
// - label      : megjelenítendő név (fejléc, címek)
//
// Új hegység felvétele: egy sor ide + a Storage-ban létre kell hozni a
// `<region>/latest.geojson` fájlt.
export const MOUNTAINS = {
  matra: { id: 'matra', region: 'Matra', label: 'Mátra', lng: 19.826587, lat: 47.9263058},
  pilis: { id: 'pilis', region: 'Pilis', label: 'Pilis', lng: 18.867196, lat: 47.715749},
  visegradi: {lng: 18.920749, lat: 47.739470},
  cserhat: {lng: 19.636888, lat: 47.948997},
  borzsony: {lng: 18.948383, lat: 47.949193},
  budai: {lng: 18.965856, lat: 47.503326},
  tatra: {lng: 19.641709, lat: 48.935992},
  bukk: {lng: 20.4357009, lat: 48.072016},
  mecsek: {lng: 18.377410, lat: 46.179822},
};

// URL-paraméterből hegység-objektum. Ismeretlen/hiányzó paraméterre null-t ad,
// így a hívó el tudja dönteni, mit csinál (redirect, hibaüzenet).
export function resolveMountain(param) {
  if (!param) return null;
  return MOUNTAINS[String(param).toLowerCase()] ?? null;
}

export const MOUNTAIN_LIST = Object.values(MOUNTAINS);