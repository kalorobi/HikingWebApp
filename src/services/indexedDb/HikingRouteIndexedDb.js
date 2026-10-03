import Dexie from 'dexie';

// FIGYELEM: az eredeti fájlodat nem láttam, ezért ez a verzió a kódból
// visszafejtett szerkezetre épül (geojsonStore + editLog, editLog kulcsa a
// `localId`). Ha nálad más a v1 séma, csak a v2-t és az upgrade-et emeld át.

const db = new Dexie('HikingRouteDb');

// --- v1: eredeti, csak Mátra ---
db.version(1).stores({
  geojsonStore: 'id',                        // id = 'main'
  editLog: '++localId, featureId, batchId'
});

// --- v2: hegységenkénti tárolás ---
// geojsonStore.id  : a hegység id-je ('matra', 'bukk', ...) a korábbi 'main' helyett
// editLog.mountain : melyik hegységhez tartozik a szerkesztés
// a [mountain+batchId] összetett index a batch-alapú undo-hoz jól jön, ha
// később a memóriabeli edits helyett közvetlenül a db-ből dolgoznál
db.version(2).stores({
  geojsonStore: 'id',
  editLog: '++localId, mountain, featureId, batchId, [mountain+batchId]'
}).upgrade(async (tx) => {
  // a meglévő adatok mind a Mátráé voltak
  await tx.table('editLog').toCollection().modify((e) => {
    e.mountain = 'matra';
  });

  const main = await tx.table('geojsonStore').get('main');
  if (main) {
    await tx.table('geojsonStore').put({ ...main, id: 'matra' });
    await tx.table('geojsonStore').delete('main');
  }
});

export default db;