import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import db from '../../services/indexedDb/HikingRouteIndexedDb';
import { downloadGeojson, uploadGeojson } from '../../services/supabase/HikingRouteSupabase';
import { applyAllEdits, validateGeojsonAgainstEdits, isToday, injectIds, stripInternalFields } from './geojsonHelpers';
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
  // featureIds lehet egyetlen id vagy id-tömb is; a payload minden érintett feature-re ugyanaz.
  // Minden dispatchEdit-hívás egy "batch"-nek számít (közös batchId-vel) - ez teszi
  // lehetővé, hogy az undoLastEdit egyetlen logikai lépésként (ne csak egy rekordként)
  // tudja visszavonni pl. egy több feature-t érintő setVisited hívást is.
  const dispatchEdit = useCallback(async (type, featureIds, payload) => {
    log.debug('dispatch edit');

    const ids = Array.isArray(featureIds) ? featureIds : [featureIds];
    const createdAt = new Date().toISOString();
    const batchId = `${createdAt}_${Math.random().toString(36).slice(2)}`;

    const newEdits = ids.map((featureId) => ({
      featureId,
      type,
      payload,
      createdAt,
      batchId,
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

  // egy way elvágása a megadott (belső) vertex-indexen. featureId a way valódi
  // (OSM eredetű) feature.id-je - NEM a properties.uid (az csak a MapLibre kattintás-
  // kezeléshez van injektálva) -, pointIndex a way geometry.coordinates tömbjének
  // indexe, ahol a vágás történjen.
  const cutWay = useCallback(
    (featureId, pointIndex) => dispatchEdit('CUT_WAY', featureId, { pointIndex }),
    [dispatchEdit]
  );

  // önálló, feature-öktől teljesen független művelet: egy gpx nevét és a
  // feldolgozás dátumát rögzíti a geojson.metadata.gpxes tömbjében. Bármikor
  // hívható, akár jóval a hozzá tartozó setVisited hívások után is - nincs
  // közöttük semmilyen kényszerű összekapcsolás. A featureId ("metadata") csak
  // egy fix placeholder, mert az editLog rekordnak formálisan kell egy featureId
  // mező, de az applyEdit ADD_GPX ágában ez nem kerül feature-matchingre.
  const addGpx = useCallback(
    (gpxName, date = new Date().toISOString()) =>
      dispatchEdit('ADD_GPX', 'metadata', { gpxName, date }),
    [dispatchEdit]
  );

  // --- "mégsem": az utolsó dispatchEdit-hívás (batch) TELJES egészének visszavonása ---
  // Típusfüggetlen: működik SET_VISITED, CUT_WAY és ADD_GPX esetén is, mert nem az
  // edit tartalmát értelmezi, csak egyszerűen eltávolítja a legutóbb létrejött batch
  // összes rekordját - a mergedGeojson (useMemo) ezután automatikusan újraszámolódik
  // baseGeojson-ból a maradék edits alapján, tehát a hatás is visszavonódik.
  const undoLastEdit = useCallback(async () => {
    if (edits.length === 0) return;

    // az edits tömb append-elve épül fel (dispatchEdit mindig a végéhez ad hozzá),
    // ezért az utolsó elem batchId-je adja a legutóbbi logikai lépést
    const lastBatchId = edits[edits.length - 1].batchId;
    const toRemove = edits.filter((e) => e.batchId === lastBatchId);
    const toRemoveLocalIds = toRemove.map((e) => e.localId).filter((id) => id !== undefined);

    log.debug('undo last edit', { batchId: lastBatchId, count: toRemove.length });

    await db.editLog.bulkDelete(toRemoveLocalIds);

    setEdits((prev) => prev.filter((e) => e.batchId !== lastBatchId));
  }, [edits]);

  const syncingRef = useRef(false);

  // --- 3. lépés: feltöltés Supabase-be ---
  const syncToSupabase = useCallback(async () => {
    if (!baseGeojson) throw new Error('Nincs betöltött geojson.');

    // egyidejű/dupla hívás elleni védelem (pl. gomb dupla kattintás lassú hálózaton) -
    // enélkül két párhuzamos sync ugyanazt a friss state-et olvasná, és a második írás
    // feleslegesen felülírná/megismételné az elsőt
    if (syncingRef.current) {
      log.debug('sync mar folyamatban, kihagyva');
      return;
    }
    syncingRef.current = true;

    try {
      // FONTOS: NEM a helyi (esetleg reggel óta cache-elt) baseGeojson-ra építünk, hanem
      // frissen letöltjük a szerver AKTUÁLIS állapotát. Enélkül, ha időközben más felhasználó
      // is feltöltött, az ő munkája csendben felülíródna a mi feltöltésünkkel (a Storage-alapú
      // "egész fájlt felülírjuk" mechanizmus miatt nincs automatikus merge a szerver oldalán).
      log.debug('fresh base download sync elott');
      const rawFreshBase = await downloadGeojson();
      const freshBase = injectIds(rawFreshBase); // uid/originalId újraszámolása a friss állapotra

      const finalGeojson = applyAllEdits(freshBase, edits);

      // created_at frissítése közvetlenül feltöltés előtt
      finalGeojson.metadata = {
        ...finalGeojson.metadata,
        created_at: new Date().toISOString()
      };

      // ellenőrzés: minden módosítás tényleg benne van-e
      const { valid, problems } = validateGeojsonAgainstEdits(finalGeojson, edits);
      if (!valid) {
        log.error('Validációs hiba feltöltés előtt:', problems);
        throw new Error('A geojson nem tartalmazza az összes módosítást: ' + problems.join(', '));
      }

      await uploadGeojson(stripInternalFields(finalGeojson));

      // FONTOS: NEM db.editLog.clear() - az az ÖSSZES rekordot törölné, beleértve azokat is,
      // amik esetleg a fenti (aszinkron) letöltés/feltöltés KÖZBEN keletkeztek (ha a felhasználó
      // tovább szerkesztett, amíg a sync folyt). Csak azokat a rekordokat töröljük, amiket
      // EBBEN a szinkronban ténylegesen feltöltöttünk (edits, a hívás pillanatában befagyasztva).
      const syncedLocalIds = edits.map((e) => e.localId).filter((id) => id !== undefined);
      await db.editLog.bulkDelete(syncedLocalIds);

      await db.geojsonStore.put({
        id: 'main',
        data: finalGeojson,
        downloaded_at: new Date().toISOString()
      });

      setBaseGeojson(finalGeojson);
      // csak a most feltöltötteket vesszük ki a state-ből, a közben hozzáadott újakat nem
      setEdits((prev) => prev.filter((e) => !syncedLocalIds.includes(e.localId)));
    } finally {
      syncingRef.current = false;
    }
  }, [baseGeojson, edits]);

  // --- kényszerített újratöltés (pl. pull-to-refresh) ---
  const forceRefresh = useCallback(async () => {
    log.debug('forcee refresh');
    setLoading(true);
    try {
      let geojson = await downloadGeojson();
      geojson = injectIds(geojson); // uid/originalId hiányzott innen, a térkép enélkül eltört volna
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
    canUndo: edits.length > 0,
    setVisited,
    cutWay,
    addGpx,
    undoLastEdit,
    syncToSupabase,
    forceRefresh
  };
}