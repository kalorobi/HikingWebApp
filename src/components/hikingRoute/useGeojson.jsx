import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import db from '../../services/indexedDb/HikingRouteIndexedDb';
import { downloadGeojson, uploadGeojson } from '../../services/supabase/HikingRouteSupabase';
import { applyAllEdits, validateGeojsonAgainstEdits, isToday, injectIds } from './geojsonHelpers';
import Logger from '../../utils/Logger';

const log = Logger.scope("useGeojson");

export function useGeojson() {
  const [baseGeojson, setBaseGeojson] = useState(null); // a "tiszta", letöltött verzió
  const [edits, setEdits] = useState([]);                // pending editLog rekordok
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const initialized = useRef(false);

  // mergedGeojson derivált érték: csak akkor számolódik újra, ha baseGeojson vagy edits változik
  const mergedGeojson = useMemo(() => {
    if (!baseGeojson) return null;
    return applyAllEdits(baseGeojson, edits);
  }, [baseGeojson, edits]);

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

          log.debug('geojson load store');

          geojson = stored.data;
        } else {

          log.debug('geojson download supabase');

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
      } catch (e) {

        log.error('Inic error', e);

        setError(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // --- 2. lépés: szerkesztés(ek) mentése (db + state) ---
  // featureIds lehet egyetlen id vagy id-tömb is; a payload minden érintett feature-re ugyanaz
  const dispatchEdit = useCallback(async (type, featureIds, payload) => {
    log.debug('dispatch edit');

    const ids = Array.isArray(featureIds) ? featureIds : [featureIds];
    const createdAt = new Date().toISOString();

    const newEdits = ids.map((featureId) => ({
      featureId,
      type,
      payload,
      createdAt,
      synced: false
    }));

    log.debug('Edit save localDb', { count: newEdits.length });

    // Egyetlen kötegelt írás az IndexedDB-be (Dexie: bulkAdd)
    const localIds = await db.editLog.bulkAdd(newEdits, { allKeys: true });

    const savedEdits = newEdits.map((edit, i) => ({ ...edit, localId: localIds[i] }));

    setEdits((prev) => [...prev, ...savedEdits]);
  }, []);

  const setVisited = useCallback(
    (featureIds, visited, date) => dispatchEdit('SET_VISITED', featureIds, { visited, date }),
    [dispatchEdit]
  );

  // --- 3. lépés: feltöltés Supabase-be ---
  const syncToSupabase = useCallback(async () => {
    if (!baseGeojson) throw new Error('Nincs betöltött geojson.');

    const finalGeojson = applyAllEdits(baseGeojson, edits);

    // ellenőrzés: minden módosítás tényleg benne van-e
    const { valid, problems } = validateGeojsonAgainstEdits(finalGeojson, edits);
    if (!valid) {
      log.error('Validációs hiba feltöltés előtt:', problems);
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
  }, [baseGeojson, edits]);

  // --- kényszerített újratöltés (pl. pull-to-refresh) ---
  const forceRefresh = useCallback(async () => {
    log.debug('forcee refresh');
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
    syncToSupabase,
    forceRefresh
  };
}