import logger from '../../utils/Logger';
 
const log = logger.scope('fetchOrsRoute');
 
const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;
const ORS_PROFILE = 'foot-hiking';
 
export async function fetchOrsRoute(coords) {
  const res = await fetch(
    `https://api.heigit.org/openrouteservice/v2/directions/${ORS_PROFILE}/geojson`,
    /*`https://api.openrouteservice.org/v2/directions/${ORS_PROFILE}/geojson`,*/
    {
      method: 'POST',
      headers: {
        'Authorization': ORS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ coordinates: coords, elevation: true }),
    }
  );
  if (!res.ok) log.error('ORS error', res.status);
  const data = await res.json();
  log.debug('ORS data is ok');
 
  return data ?? null;
}