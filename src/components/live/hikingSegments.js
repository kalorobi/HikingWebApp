import logger from '../../utils/Logger';

const log = logger.scope('hikingSegments');

// Élő pontok szétválasztása "hiking" szakaszokra
// (pl. hiking -> car -> hiking esetén két külön szakasz)
// A pontok már időrendben vannak, ezért elég egy lineáris bejárás.
//
// Ezt HASZNÁLJA mind az ORS-simítás (useOrsSnappedSegments), mind a nyers
// (nem simított) élő vonalak felépítése a végső geojson-ban - ezért van egy
// közös, kis segédmodulban, nem az ORS-hook belsejében.
export function segmentHikingRuns(points) {
  if (!points?.length) return [];
  
  const segments = [];
  let current = [];

  for (const p of points) {
    if (p.properties?.mode === 'hiking') {
      current.push(p.geometry.coordinates);
    } else if (current.length) {
      segments.push(current);
      current = [];
    }
  }
  if (current.length) segments.push(current);

  log.debug('Hiking segment', segments.length);
  return segments;
}