import { useState, useEffect, useCallback, useRef } from 'react';
import db from '../../services/HikingRouteIndexedDb';
import { downloadGeojson, uploadGeojson } from '../../services/HikingRouteSupabase';
import { applyAllEdits, validateGeojsonAgainstEdits, isToday, injectIds } from './geojsonHelpers';

export function useGeojson() {
  const [baseGeojson, setBaseGeojson] = useState(null); // a "tiszta", letöltött verzió
  const [edits, setEdits] = useState([]);                // pending editLog rekordok
  const [mergedGeojson, setMergedGeojson] = useState(null); // baseGeojson + edits => térképre ez kell
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const initialized = useRef(false);

  // --- 1. lépés: induláskor ellenőrzés, letöltés ha kell ---
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    (async () => {
      try {
        setLoading(true);
        const stored = await db.geojsonStore.get('main');

        let geojson;
        if (stored && isToday(stored.downloaded_at)) {
          geojson = stored.data;
        } else {
          geojson = await downloadGeojson();
          //maplibre megeszi az id-t!
          geojson = injectIds(geojson); 

          await db.geojsonStore.put({
            id: 'main',
            data: geojson,
            downloaded_at: new Date().toISOString()
          });
        }

        const storedEdits = await db.editLog.toArray();

        setBaseGeojson(geojson);
        setEdits(storedEdits);
        setMergedGeojson(applyAllEdits(geojson, storedEdits));
      } catch (e) {
        setError(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // --- 2. lépés: szerkesztés mentése (db + state) ---
  const dispatchEdit = useCallback(async (type, featureId, payload) => {
    const edit = {
      featureId,
      type, // 'SET_VISITED' | 'SET_VISITED_DATAS'
      payload,
      createdAt: new Date().toISOString(),
      synced: false
    };

    const localId = await db.editLog.add(edit);
    const savedEdit = { ...edit, localId };

    setEdits((prev) => {
      const next = [...prev, savedEdit];
      setMergedGeojson(applyAllEdits(baseGeojson, next));
      return next;
    });
  }, [baseGeojson]);

  const setVisited = useCallback(
    (featureId, visited) => dispatchEdit('SET_VISITED', featureId, visited),
    [dispatchEdit]
  );

  const setVisitedDatas = useCallback(
    (featureId, visitedData) => dispatchEdit('SET_VISITED_DATAS', featureId, visitedData),
    [dispatchEdit]
  );

  // --- 3. lépés: feltöltés Supabase-be ---
  const syncToSupabase = useCallback(async () => {
    if (!baseGeojson) throw new Error('Nincs betöltött geojson.');

    const finalGeojson = applyAllEdits(baseGeojson, edits);

    // 4. ellenőrzés: minden módosítás tényleg benne van-e
    const { valid, problems } = validateGeojsonAgainstEdits(finalGeojson, edits);
    if (!valid) {
      console.error('Validációs hiba feltöltés előtt:', problems);
      throw new Error('A geojson nem tartalmazza az összes módosítást: ' + problems.join(', '));
    }

    await uploadGeojson(finalGeojson);

    // sikeres feltöltés után: log ürítése, base frissítése a mai dátummal
    await db.editLog.clear();
    await db.geojsonStore.put({
      id: 'main',
      data: finalGeojson,
      downloaded_at: new Date().toISOString()
    });

    setBaseGeojson(finalGeojson);
    setEdits([]);
    setMergedGeojson(finalGeojson);
  }, [baseGeojson, edits]);

  // --- kényszerített újratöltés (pl. pull-to-refresh) ---
  const forceRefresh = useCallback(async () => {
    setLoading(true);
    try {
      const geojson = await downloadGeojson();
      await db.geojsonStore.put({
        id: 'main',
        data: geojson,
        downloaded_at: new Date().toISOString()
      });
      await db.editLog.clear();

      setBaseGeojson(geojson);
      setEdits([]);
      setMergedGeojson(geojson);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    geojson: mergedGeojson,
    loading,
    error,
    pendingEditsCount: edits.length,
    setVisited,
    setVisitedDatas,
    syncToSupabase,
    forceRefresh
  };
}