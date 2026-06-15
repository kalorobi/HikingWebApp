import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from './SupabaseClient';

export function useLiveCoordinates(user_id) {
  const [plannedRoutes, setPlannedRoutes] = useState([]);
  const [livePoints, setLivePoints] = useState([]);

  // -------------------------
  // LIVE POINT HANDLER
  // -------------------------
  const addPoint = useCallback((row) => {
    if (row.lat == null || row.lng == null) return;
    const timeLabel = new Date(row.created_at).toLocaleTimeString('hu-HU', {
      hour: '2-digit', minute: '2-digit',})
    const newPoint = {
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

    setLivePoints(prev => [...prev, newPoint]);
  }, []);

  // -------------------------
  // PLANNED ROUTES FETCH
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
        // .limit(1) eltávolítva — minden aktív útvonalat lekérünk

      if (error) {
        console.error(error);
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
    const hikingPoints = livePoints.filter(
      p => p.properties?.mode === 'hiking'
    );

    const liveLineCoords =
      hikingPoints.length >= 2
        ? hikingPoints.map(p => p.geometry.coordinates)
        : null;

    // Minden planned route-ból Feature-t csinálunk
    const plannedFeatures = plannedRoutes.flatMap(route => {
      const coords = route.geojson?.features?.[0]?.geometry?.coordinates ?? null;
      if (!coords) return [];
      return [{
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: coords,
        },
        properties: {
          routeType: 'planned',
          plan_name: route.plan_name,
          mountain: route.mountain,
          description: route.description,
          link: route.link,
        },
      }];
    });

    return {
      type: 'FeatureCollection',
      features: [
        ...plannedFeatures,

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
  }, [plannedRoutes, livePoints]);

  return { geojson };
}