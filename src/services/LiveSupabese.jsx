import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from './SupabaseClient';

export function useLiveCoordinates(user_id) {
  const [plannedRoute, setPlannedRoute] = useState(null);
  const [livePoints, setLivePoints] = useState([]);

  // -------------------------
  // LIVE POINT HANDLER
  // -------------------------
  const addPoint = useCallback((row) => {
    const newPoint = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [row.lng, row.lat].filter(v => v !== null),
      },
      properties: {
        created_at: row.created_at,
        mode: row.mode ?? 'car',
        gsm: row.gsm ?? null,
        battery: row.battery ?? null,
        locus_time: row.locus_time ?? null,
      },
    };

    setLivePoints(prev => [...prev, newPoint]);
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

      if (error) {
        console.error(error);
        return;
      }

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
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('live_coordinates')
        .select('*')
        .eq('user_id', user_id)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: true });

      if (cancelled || error) return;
      data?.forEach(addPoint);
    };

    fetchInitial();

    return () => {
      cancelled = true;
    };
  }, [user_id, addPoint]);

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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user_id, addPoint]);

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
            geometry: {
              type: 'LineString',
              coordinates: plannedCoords,
            },
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
            geometry: {
              type: 'LineString',
              coordinates: liveLineCoords,
            },
            properties: {
              routeType: 'live',
            },
          }]
        : []),

      ...livePoints,
    ],
  };
}, [plannedRoute, livePoints]);

  return { geojson };
}