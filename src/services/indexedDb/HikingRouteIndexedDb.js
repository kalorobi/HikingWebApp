import Dexie from 'dexie';

export const db = new Dexie('GeojsonAppDB');

db.version(1).stores({
  // egyetlen geojson "dokumentumot" tárolunk, fix id-vel
  geojsonStore: 'id', // { id: 'main', data: {...geojson}, downloaded_at: '2026-06-30' }
  // a szerkesztési lépések naplója (offline-safe)
  editLog: '++localId, featureId, type, createdAt, synced'
});

export default db;