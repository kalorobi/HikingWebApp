//FULL CLAUDE AI - pici szogelessel :)
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from './SupabaseClient';

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
  if (!res.ok) throw new Error(`ORS error: ${res.status}`);
  const data = await res.json();

  //return data.features?.[0]?.geometry?.coordinates ?? null;
  return data ?? null
}

export function useLiveCoordinates(user_id) {
  const [plannedRoute, setPlannedRoute] = useState(null);
  const [livePoints, setLivePoints] = useState([]);
  const [flatCoords, setFlatCoords] = useState([]);
  const [isRefetching, setIsRefetching] = useState(false);

  const orsCache = useRef({});
  const orsMeta = useRef({});
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
      console.error(error);
      return [];
    }
    return data ?? [];
  }, []);

  // -------------------------
  // PLANNED ROUTE FETCH
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
        .order('created_at', { ascending: false })
        .limit(1);
      if (error) { console.error(error); return; }
      setPlannedRoute(data?.[0] ?? null);
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
    } finally {
      setIsRefetching(false);
    }
  }, [user_id, fetchTodaysPoints, addPoint]);

  // Automatikus pótlás amikor a tab/app újra látható lesz
  // (mobilon ez fut amikor a felhasználó visszavált az appra/böngészőre)
  useEffect(() => {
    if (user_id == null || user_id < 0) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
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
  // ORS SNAPPED ROUTE (live-flat)
  // -------------------------
  useEffect(() => {
    const hikingCoords = livePoints
      .filter(p => p.properties?.mode === 'hiking')
      .map(p => p.geometry.coordinates);

    if (hikingCoords.length < 2) {
      setFlatCoords([]);
      return;
    }

    const waypointIndices = [];
    for (let i = 0; i < hikingCoords.length; i += ORS_STEP) {
      waypointIndices.push(i);
    }
    const lastWaypointIdx = waypointIndices[waypointIndices.length - 1];
    const waypoints = waypointIndices.map(i => hikingCoords[i]);
    const remainder = hikingCoords.slice(lastWaypointIdx);

    if (waypoints.length < 2) {
      setFlatCoords(hikingCoords);
      return;
    }

    const cacheKey = waypoints.map(c => c.join(',')).join('|');
    let cancelled = false;

    const buildFlatLine = async () => {
      let orsSnapped;
      let snapped;

      if (orsCache.current[cacheKey]) {
        snapped = orsCache.current[cacheKey];
      } else {
        try {
          orsSnapped = await fetchOrsRoute(waypoints);
          snapped = orsSnapped.features[0]?.geometry.coordinates;
          orsMeta.current = orsSnapped.features[0]?.properties;
          if (cancelled) return;
          if (!snapped?.length) throw new Error('Empty ORS response');
          orsCache.current[cacheKey] = snapped;
        } catch (err) {
          console.warn('ORS routing failed, using raw waypoints:', err);
          if (cancelled) return;
          snapped = waypoints;
          orsCache.current[cacheKey] = snapped;
        }
      }

      const full = remainder.length > 1
        ? [...snapped, ...remainder.slice(1)]
        : snapped;

      if (!cancelled) setFlatCoords(full);
    };

    buildFlatLine();
    return () => { cancelled = true; };
  }, [livePoints]);

  // -------------------------
  // GEOJSON BUILD
  // -------------------------
  const geojson = useMemo(() => {
    const plannedCoords =
      plannedRoute?.geojson?.features?.[0]?.geometry?.coordinates ?? null;

    const hikingPoints = livePoints.filter(
      p => p.properties?.mode === 'hiking'
    );

    const liveLineCoords =
      hikingPoints.length >= 2
        ? hikingPoints.map(p => p.geometry.coordinates)
        : null;

    return {
      type: 'FeatureCollection',
      features: [
        ...(plannedCoords
          ? [{
              type: 'Feature',
              geometry: { type: 'LineString', coordinates: plannedCoords },
              properties: {
                routeType: 'planned',
                plan_name: plannedRoute?.plan_name,
                mountain: plannedRoute?.mountain,
                description: plannedRoute?.description,
                link: plannedRoute?.link,
              },
            }]
          : []),

        ...(liveLineCoords
          ? [{
              type: 'Feature',
              geometry: { type: 'LineString', coordinates: liveLineCoords },
              properties: { routeType: 'live' },
            }]
          : []),

        ...(flatCoords.length >= 2
          ? [{
              type: 'Feature',
              geometry: { type: 'LineString', coordinates: flatCoords },
              properties: { 
                ...orsMeta.current,
                routeType: 'live-flat'

              },
            }]
          : []),

        ...livePoints,
      ],
    };
  }, [plannedRoute, livePoints, flatCoords]);

  return { geojson, refetchMissingPoints, isRefetching };
}