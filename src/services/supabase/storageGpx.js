import { supabase } from "../SupabaseClient";

const BUCKET = 'gpx';

export async function listGpxFiles(folder = BUCKET) {
  const { data, error } = await supabase.storage.from(BUCKET).list("", {limit: 500});

  if (error) {
    throw error;
  }

  const gpxFiles = (data ?? [])
    .filter((item) => item.name?.toLowerCase().endsWith('.gpx'))
    .map((item) => item.name);

  return gpxFiles;
}

export async function downloadGpx(fileName, folder = BUCKET) {

  const { data, error } = await supabase.storage.from(BUCKET).download(fileName);
  if (error) {
    throw error;
  }

  const text = await data.text();
  return text;
}