import { supabase } from '../supabaseClient';

export async function geojsonSupabase(user) {

  const today = new Date(); today.setHours(0, 0, 0, 0);

  const { data, error} = await supabase
  .from('coordinates')
  .select('lat, lng', 'mode')
  .eq('user', user)
  .gte('time', today.toISOString())
  .order('time', { ascending: true }); 

  if (error) {
    console.error(error);
    throw error;
  }

  if(data.length === 0){
    return {
      type: "FeatureCollection",
      features : []
    }
  }

  return {
    type: "FeatureCollection",
    features: data.map(row => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [row.lng, row.lat]
      },
      properties: {
        mode: row.mode || null,
        gsm: row.gsm || null,
        battery: row.battery || null
      }
    }))
  };
}

export function subscribeSupabase(dispatch) {

  const channel = supabase
    .channel("coordinates-realtime")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "coordinates"
      },
      payload => {
        dispatch({
          type: "ADD_POINT",
          payload: { type: "Feature", geometry: {type: "Point",
            coordinates: [payload.new.lng, payload.new.lat]},
            properties: {}}
        });
      }
    ).subscribe(status => {console.log("STATUS", status);})
}