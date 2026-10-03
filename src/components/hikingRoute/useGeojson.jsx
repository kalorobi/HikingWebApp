import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import db from '../../services/indexedDb/HikingRouteIndexedDb';
import { downloadGeojson, uploadGeojson } from '../../services/supabase/HikingRouteSupabase';
import { applyAllEdits, validateGeojsonAgainstEdits, isToday, injectIds, stripInternalFields } from './geojsonHelpers';
import { resolveMountain } from '../../utils/mountains';
import Logger from '../../utils/Logger';

const log = Logger.scope("useGeojson");

// A hook egy KONKRÉT hegység adatait kezeli. A `mountainId` az URL-ből jön
// (/hikingRoute/:mountain), és egyben az IndexedDB kulcsa is:
//   - geojsonStore.id        = mountainId
//   - editLog[].mountain     = mountainId
// Így több hegység adata és pending szerkesztése is elfér egymás mellett a
// helyi adatbázisban anélkül, hogy keverednének.
export function useGeojson(mountainId) {
  const [baseGeojson, setBaseGeojson] = useState(null); // a "tiszta", letöltött verzió
  const [edits, setEdits] = useState([]);                // pending editLog rekordok
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // NEM sima boolean, mint korábban: azt jegyezzük, MELYIK hegységre futott le az
  // inicializálás - így hegységváltáskor újra le tud futni, ugyanarra a hegységre
  // viszont (re-render, StrictMode dupla effekt) nem fut le kétszer
  const initializedFor = useRef(null);

  // hegységváltáskor a még futó, régi async betöltés eredményét el kell dobni,
  // különben a lassabb (régi) válasz felülírhatná az újat
  const loadTokenRef = useRef(0);

  const mountain = resolveMountain(mountainId);
  const region = mountain?.region ?? null;

  // mergedGeojson derivált érték: csak akkor számolódik újra, ha baseGeojson vagy edits változik
  const mergedGeojson = useMemo(() => {
    if (!baseGeojson) return null;
    return applyAllEdits(baseGeojson, edits);
  }, [baseGeojson, edits]);

  // --- 1. lépés: induláskor (és hegységváltáskor) ellenőrzés, letöltés ha kell ---
  useEffect(() => {
    if (!mountainId || !region) {
      log.error('Ismeretlen hegység', mountainId);
      setError(new Error(`Ismeretlen hegység: ${mountainId ?? '-'}`));
      setLoading(false);
      return;
    }

    if (initializedFor.current === mountainId) return;
    initializedFor.current = mountainId;

    const token = ++loadTokenRef.current;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        // azonnal ürítünk, nehogy hegységváltáskor egy pillanatra a RÉGI hegység
        // adatai villanjanak fel az új alatt
        setBaseGeojson(null);
        setEdits([]);

        const stored = await db.geojsonStore.get(mountainId);

        let geojson;
        if (stored && isToday(stored.downloaded_at)) {

          log.debug('geojson load store', { mountain: mountainId });

          geojson = stored.data;
        } else {

          log.debug('geojson download supabase', { mountain: mountainId });

          geojson = await downloadGeojson(region);
          //maplibre megeszi az id-t!
          geojson = injectIds(geojson);

          await db.geojsonStore.put({
            id: mountainId,
            data: geojson,
            downloaded_at: new Date().toISOString()
          });
        }

        // csak EHHEZ a hegységhez tartozó pending szerkesztések
        const storedEdits = await db.editLog.where('mountain').equals(mountainId).toArray();

        // közben hegységet váltottak - ez a válasz már elavult, eldobjuk
        if (token !== loadTokenRef.current) {
          log.debug('elavult betoltes eldobva', { mountain: mountainId });
          return;
        }

        setBaseGeojson(geojson);
        setEdits(storedEdits);
      } catch (e) {

        log.error('Inic error', e);

        if (token === loadTokenRef.current) setError(e);
      } finally {
        if (token === loadTokenRef.current) setLoading(false);
      }
    })();
  }, [mountainId, region]);

  // --- 2. lépés: szerkesztés(ek) mentése (db + state) ---
  // featureIds lehet egyetlen id vagy id-tömb is; a payload minden érintett feature-re ugyanaz.
  // Minden dispatchEdit-hívás egy "batch"-nek számít (közös batchId-vel) - ez teszi
  // lehetővé, hogy az undoLastEdit egyetlen logikai lépésként (ne csak egy rekordként)
  // tudja visszavonni pl. egy több feature-t érintő setVisited hívást is.
  // Minden rekord megkapja a `mountain` mezőt is, hogy betöltéskor/törléskor
  // hegységenként tudjuk szűrni őket.
  const dispatchEdit = useCallback(async (type, featureIds, payload) => {
    if (!mountainId) {
      log.error('dispatchEdit hegység nélkül, kihagyva', { type });
      return;
    }

    log.debug('dispatch edit');

    const ids = Array.isArray(featureIds) ? featureIds : [featureIds];
    const createdAt = new Date().toISOString();
    const batchId = `${createdAt}_${Math.random().toString(36).slice(2)}`;

    const newEdits = ids.map((featureId) => ({
      mountain: mountainId,
      featureId,
      type,
      payload,
      createdAt,
      batchId,
      synced: false
    }));

    log.debug('Edit save localDb', { count: newEdits.length, mountain: mountainId });

    // Egyetlen kötegelt írás az IndexedDB-be (Dexie: bulkAdd)
    const localIds = await db.editLog.bulkAdd(newEdits, { allKeys: true });

    const savedEdits = newEdits.map((edit, i) => ({ ...edit, localId: localIds[i] }));

    setEdits((prev) => [...prev, ...savedEdits]);
  }, [mountainId]);

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
  // Az `edits` state eleve csak az aktuális hegység rekordjait tartalmazza, ezért
  // itt nincs szükség további hegység-szűrésre.
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
    if (!region) throw new Error('Nincs kiválasztott hegység.');

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
      setLoading(true);
      log.debug('fresh base download sync elott', { mountain: mountainId });
      const rawFreshBase = await downloadGeojson(region);
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

      await uploadGeojson(region, stripInternalFields(finalGeojson));

      // FONTOS: NEM db.editLog.clear() - az az ÖSSZES rekordot törölné, beleértve a MÁSIK
      // hegységekhez tartozókat és azokat is, amik esetleg a fenti (aszinkron)
      // letöltés/feltöltés KÖZBEN keletkeztek (ha a felhasználó tovább szerkesztett,
      // amíg a sync folyt). Csak azokat a rekordokat töröljük, amiket EBBEN a
      // szinkronban ténylegesen feltöltöttünk (edits, a hívás pillanatában befagyasztva).
      const syncedLocalIds = edits.map((e) => e.localId).filter((id) => id !== undefined);
      await db.editLog.bulkDelete(syncedLocalIds);

      await db.geojsonStore.put({
        id: mountainId,
        data: finalGeojson,
        downloaded_at: new Date().toISOString()
      });

      setBaseGeojson(finalGeojson);
      // csak a most feltöltötteket vesszük ki a state-ből, a közben hozzáadott újakat nem
      setEdits((prev) => prev.filter((e) => !syncedLocalIds.includes(e.localId)));
    } finally {
      syncingRef.current = false;
      setLoading(false);
    }
  }, [baseGeojson, edits, mountainId, region]);

  // --- kényszerített újratöltés (pl. pull-to-refresh) ---
  const forceRefresh = useCallback(async () => {
    if (!region) return;

    log.debug('forcee refresh', { mountain: mountainId });
    setLoading(true);
    try {
      let geojson = await downloadGeojson(region);
      geojson = injectIds(geojson); // uid/originalId hiányzott innen, a térkép enélkül eltört volna
      await db.geojsonStore.put({
        id: mountainId,
        data: geojson,
        downloaded_at: new Date().toISOString()
      });
      // FONTOS: nem clear(), csak az adott hegység rekordjai - különben a másik
      // hegységeken még el nem küldött szerkesztések is elvesznének
      await db.editLog.where('mountain').equals(mountainId).delete();

      setBaseGeojson(geojson);
      setEdits([]);
    } finally {
      setLoading(false);
    }
  }, [mountainId, region]);

  return {
    mountain,
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