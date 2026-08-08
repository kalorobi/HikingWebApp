//FULL CLAUDE AI - pici szogelessel :)
import { useMemo } from 'react';
import { useLivePlannedRoutes } from '../../services/query/liveQuery/useLivePlannedRoutes';
import { useLiveTrackingPoints } from '../../services/query/liveQuery/useLiveTrackedPoints';
import { useOrsSnappedSegments } from '../live/useOrsSnappedSegments';
import { segmentHikingRuns } from './hikingSegments';

export function useLiveCoordinates(user_id) {

  // --- "plan" típusú adat: ritkán változik, a query réteg kezeli a cache-t ---
  const { plannedRoutes } = useLivePlannedRoutes(user_id);

  // --- "live" típusú adat: letöltés + Realtime feliratkozás, a query réteg
  //     kezeli a cache-t, a dedupe-ot és a fókusz-/reconnect-alapú frissítést ---
  const { points: rawPoints, isRefetching, refetch } = useLiveTrackingPoints(user_id);

  // -------------------------
  // Nyers DB sorokból GeoJSON Point feature-öket építünk (timeLabel-lel) -
  // ez SZÁRMAZTATOTT állapot a lekérdezés eredményéből, nem külön query
  // -------------------------
  const livePoints = useMemo(() => {
    return rawPoints
      .filter((row) => row.lat != null && row.lng != null)
      .map((row) => {
        const timeLabel = new Date(row.created_at).toLocaleTimeString('hu-HU', {
          hour: '2-digit', minute: '2-digit',
        });

        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [row.lng, row.lat],
          },
          properties: {
            created_at: row.created_at,
            timeLabel: timeLabel,
            mode: row.mode ?? 'car',
            gsm: row.gsm ?? null,
            battery: row.battery ?? null,
            locus_time: row.locus_time ?? null,
          },
        };
      });
  }, [rawPoints]);

  // --- a nyers hiking-szakaszok "úthoz igazítása" (ORS-simítás), kiszervezve ---
  const flatSegments = useOrsSnappedSegments(livePoints);

  // -------------------------
  // GEOJSON BUILD
  // -------------------------
  const geojson = useMemo(() => {
    // Minden aktív+kész planned route → össze feature-je (LineString ÉS Point egyaránt)
    const plannedFeatures = plannedRoutes.flatMap(route => {
      const features = route?.geojson?.features ?? [];

      return features.flatMap(f => {
        if (!f?.geometry) return [];

        // --- Vonal (útvonal szakaszok) ---
        if (f.geometry.type === 'LineString') {
          const coords = f.geometry.coordinates;
          if (!coords?.length) return [];
          return [{
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: coords },
            properties: {
              ...f.properties,
              routeType: 'planned',
              plan_name: route.plan_name,
              mountain: route.mountain,
              description: route.description,
              link: route.link,
            },
          }];
        }

        // --- Pont (pl. érdekes hely, útelágazás, stb.) ---
        if (f.geometry.type === 'Point') {
          const coords = f.geometry.coordinates;
          if (!coords) return [];
          return [{
            type: 'Feature',
            geometry: { type: 'Point', coordinates: coords },
            properties: {
              // a pont saját description-je itt marad, NEM írjuk felül route.description-nel
              ...f.properties,
              routeType: 'planned-point',
              plan_name: route.plan_name,
              mountain: route.mountain,
              link: route.link,
            },
          }];
        }

        // egyéb geometry típusokat (pl. Polygon) most nem kezelünk
        return [];
      });
    });

    // Nyers (GPS) hiking szakaszok, autós szünetek mentén szétválasztva
    const liveSegments = segmentHikingRuns(livePoints).filter(seg => seg.length >= 2);

    const liveLineFeatures = liveSegments.map((coords, idx) => ({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: coords },
      properties: { routeType: 'live', segmentIndex: idx },
    }));

    // ORS-snapelt szakaszok, ugyanazzal a szegmens-indexeléssel
    const liveFlatFeatures = flatSegments
      .filter(seg => seg.coords?.length >= 2)
      .map((seg, idx) => ({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: seg.coords },
        properties: {
          ...(seg.meta ?? {}),
          routeType: 'live-flat',
          segmentIndex: idx,
        },
      }));

    return {
      type: 'FeatureCollection',
      features: [
        ...plannedFeatures,
        ...liveLineFeatures,
        ...liveFlatFeatures,
        ...livePoints,
      ],
    };
  }, [plannedRoutes, livePoints, flatSegments]);

  return { geojson, refetchMissingPoints: refetch, isRefetching };
}