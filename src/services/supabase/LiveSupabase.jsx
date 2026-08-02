//FULL CLAUDE AI - pici szogelessel :)
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../SupabaseClient';
import logger from '../../utils/Logger';

const log = logger.scope("LiveSupabase_3");

const ORS_API_KEY =  import.meta.env.VITE_ORS_API_KEY;
const ORS_PROFILE = 'foot-hiking';
const ORS_STEP = 5; // minden ORS_STEP-edik pont lesz waypoint

async function fetchOrsRoute(coords) {
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
  log.debug('ORS data is ok')
  
  return data ?? null
}

// -------------------------
// Live pontok szétválasztása "hiking" szakaszokra
// (pl. hiking -> car -> hiking esetén két külön szakasz)
// A livePoints már időrendben van, ezért elég egy lineáris bejárás.
// -------------------------
function segmentHikingRuns(points) {
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

export function useLiveCoordinates(user_id) {

  const [plannedRoutes, setPlannedRoutes] = useState([]); // több planned route
  const [livePoints, setLivePoints] = useState([]);
  const [flatSegments, setFlatSegments] = useState([]); // [{ coords, meta }, ...] szegmensenként
  const [isRefetching, setIsRefetching] = useState(false);

  const orsCache = useRef({});
  // Már ismert created_at értékek, gyors duplikáció-szűréshez
  const knownTimestamps = useRef(new Set());

  // -------------------------
  // LIVE POINT HANDLER
  // -------------------------
  const addPoint = useCallback((row) => {
    if (row.lat == null || row.lng == null) return;
    if (row.created_at && knownTimestamps.current.has(row.created_at)) return;
    if (row.created_at) knownTimestamps.current.add(row.created_at);
    const timeLabel = new Date(row.created_at).toLocaleTimeString('hu-HU', {
      hour: '2-digit', minute: '2-digit',})

    setLivePoints(prev => [...prev, {
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
    }]);
  }, []);

  // -------------------------
  // SHARED FETCH LOGIC (initial + manual refetch ugyanazt használja)
  // -------------------------
  const fetchTodaysPoints = useCallback(async (user_id) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('live_coordinates')
      .select('*')
      .eq('user_id', user_id)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      log.error('Live point today', error)
      return [];
    }

    log.debug('Live point today fetch is ok')
    return data ?? [];
  }, []);

  // -------------------------
  // PLANNED ROUTES FETCH (összes aktív és kész)
  // -------------------------
  useEffect(() => {
    if (user_id == null || user_id < 0) return;
    const fetchPlanned = async () => {
      const { data, error } = await supabase
        .from('live_plan_routes')
        .select('plan_name, description, link, mountain, geojson')
        .eq('user_id', user_id)
        .eq('is_active', true)
        .eq('is_ready', true)
        .order('created_at', { ascending: false });
      // limit(1) eltávolítva – az összes megfelelő route bekerül
      if (error) { 
        log.error('Plan route', error); 
        return; 
      }

      setPlannedRoutes(data ?? []);
    };
    fetchPlanned();
  }, [user_id]);

  // -------------------------
  // INITIAL LIVE DATA
  // -------------------------
  useEffect(() => {
    if (user_id == null || user_id < 0) return;
    let cancelled = false;

    const fetchInitial = async () => {
      const data = await fetchTodaysPoints(user_id);
      if (cancelled) return;
      data.forEach(addPoint);
    };

    fetchInitial();
    return () => { cancelled = true; };
  }, [user_id, addPoint, fetchTodaysPoints]);

  // -------------------------
  // REALTIME SUBSCRIPTION
  // -------------------------
  useEffect(() => {
    if (user_id == null || user_id < 0) return;
    const channel = supabase
      .channel(`live_coordinates_user_${user_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_coordinates',
          filter: `user_id=eq.${user_id}`,
        },
        (payload) => addPoint(payload.new)
      )
      .subscribe();

      log.debug('Supabase live');
    return () => { supabase.removeChannel(channel); };
  }, [user_id, addPoint]);

  // -------------------------
  // MANUÁLIS / AUTOMATIKUS PÓTLÁS (kimaradt pontok)
  // -------------------------
  const refetchMissingPoints = useCallback(async () => {
    if (user_id == null || user_id < 0) return;
    setIsRefetching(true);
    try {
      const data = await fetchTodaysPoints(user_id);
      // addPoint már szűr a knownTimestamps alapján, tehát csak
      // az új (kimaradt) pontok kerülnek be a state-be
      data.forEach(addPoint);
    }
    catch (error) {
      log.error('Refetch error', error);
    }
    finally {
      setIsRefetching(false);
      log.debug('Refetch is ok')
    }
  }, [user_id, fetchTodaysPoints, addPoint]);

  // Automatikus pótlás amikor a tab/app újra látható lesz
  // (mobilon ez fut amikor a felhasználó visszavált az appra/böngészőre)
  useEffect(() => {
    if (user_id == null || user_id < 0) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        log.debug('Visibel change')
        refetchMissingPoints();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    // Mobil Safari/Chrome esetén a pageshow is hasznos (bfcache visszatérés)
    window.addEventListener('pageshow', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handleVisibilityChange);
    };
  }, [user_id, refetchMissingPoints]);

  // -------------------------
  // ORS SNAPPED ROUTE (live-flat) — szegmensenként
  // -------------------------
  useEffect(() => {
    if (user_id == null || user_id < 0) return;
    
    const hikingSegments = segmentHikingRuns(livePoints);
    const validSegments = hikingSegments.filter(seg => seg.length >= 2);

    if (validSegments.length === 0) {
      setFlatSegments([]);
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

  return { geojson, refetchMissingPoints, isRefetching };
}