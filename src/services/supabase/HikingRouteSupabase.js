import { supabase } from "../SupabaseClient";

const BUCKET = 'hikingRoute';
const FILE_PATH = 'latest.geojson';

export async function downloadGeojson() {
  const { data, error } = await supabase.storage.from(BUCKET).download(FILE_PATH);
  if (error) throw error;
  const text = await data.text();
  return JSON.parse(text);
}

export async function uploadGeojson(geojson) {
  const blob = new Blob([JSON.stringify(geojson)], { type: 'application/json' });
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(FILE_PATH, blob, { upsert: true, contentType: 'application/json' });
  if (error) throw error;
}