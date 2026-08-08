import { useState, useEffect, useRef } from 'react';
import { segmentHikingRuns } from './hikingSegments'
import { fetchOrsRoute } from '../../services/api/fetchOrsRoute'
import logger from '../../utils/Logger';
 
const log = logger.scope('useOrsSnappedSegments');
const ORS_STEP = 5; // minden ORS_STEP-edik pont lesz waypoint
 
// A nyers GPS hiking-szakaszokat "úthoz igazítja" (snap) az OpenRouteService-en
// keresztül, szegmensenként, saját cache-eléssel. Teljesen független attól,
// HONNAN jönnek a livePoints (query, state, bármi) - csak koordinátákat kap,
// és a simított szegmenseket adja vissza.
export function useOrsSnappedSegments(livePoints) {
  
  const [flatSegments, setFlatSegments] = useState([]);
  const orsCache = useRef({});
 
  useEffect(() => {

    const hikingSegments = segmentHikingRuns(livePoints);
    const validSegments = hikingSegments.filter(seg => seg.length >= 2);
 
    if (validSegments.length === 0) {
      setFlatSegments(prev => (prev.length === 0 ? prev : []));
      return;
    }
 
    let cancelled = false;
 
    // Egy szegmens snap-elése ORS-szel, saját cache-eléssel
    const buildSegment = async (segCoords) => {
      const waypointIndices = [];
      for (let i = 0; i < segCoords.length; i += ORS_STEP) {
        waypointIndices.push(i);
      }
      const lastWaypointIdx = waypointIndices[waypointIndices.length - 1];
      const waypoints = waypointIndices.map(i => segCoords[i]);
      const remainder = segCoords.slice(lastWaypointIdx);
 
      if (waypoints.length < 2) {
        return { coords: segCoords, meta: null };
      }
 
      const cacheKey = waypoints.map(c => c.join(',')).join('|');
 
      if (orsCache.current[cacheKey]) {
        const { snapped, meta } = orsCache.current[cacheKey];
        const coords = remainder.length > 1
          ? [...snapped, ...remainder.slice(1)]
          : snapped;
        return { coords, meta };
      }
 
      try {
        const orsSnapped = await fetchOrsRoute(waypoints);
        const snapped = orsSnapped.features[0]?.geometry.coordinates;
        const meta = orsSnapped.features[0]?.properties ?? null;
        if (!snapped?.length) throw new Error('Empty ORS response');
 
        orsCache.current[cacheKey] = { snapped, meta };
        const coords = remainder.length > 1
          ? [...snapped, ...remainder.slice(1)]
          : snapped;
        return { coords, meta };
      } catch (err) {
        log.warn('ORS routing failed', err);
 
        const snapped = waypoints;
 
        const coords = remainder.length > 1
          ? [...snapped, ...remainder.slice(1)]
          : snapped;
 
        // Fontos: sikertelen ORS választ NEM cache-elünk,
        // így a következő frissítéskor újra megpróbáljuk.
        return { coords, meta: null };
      }
    };
 
    const buildAll = async () => {
      // szegmensek egymástól függetlenek -> párhuzamosan hívhatók
      const results = await Promise.all(validSegments.map(buildSegment));
      if (!cancelled) setFlatSegments(results);
    };
 
    buildAll();
    return () => { cancelled = true; };
  }, [livePoints]);
 
  return flatSegments;
}