export function findWays(geojson, feature) {
  const index = buildEndpointIndex(geojson);

  const ways = { type: "FeatureCollection", features: [feature] };

  // balra haladás
  let way = feature;
  let direction = 0;
  while (true) {
    const found = findWay(index, way, direction);
    if (found.ways.length !== 1) break;
    ways.features.unshift(found.ways[0]);
    way = found.ways[0];
    direction = found.direction;
  }

  // jobbra haladás
  way = feature;
  direction = 1;
  while (true) {
    const found = findWay(index, way, direction);
    if (found.ways.length !== 1) break;
    ways.features.push(found.ways[0]);
    way = found.ways[0];
    direction = found.direction;
  }

  return ways;
}

function coordKey(coord) {
  return coord[0] + ',' + coord[1];
}

function buildEndpointIndex(geojson) {
  const index = new Map();

  for (const f of geojson.features) {
    if (f.properties.type !== 'way') continue;

    const coords = f.geometry.coordinates;
    const startKey = coordKey(coords[0]);
    const endKey = coordKey(coords[coords.length - 1]);

    addToIndex(index, startKey, { feature: f, atStart: true });
    addToIndex(index, endKey, { feature: f, atStart: false });
  }

  return index;
}

function addToIndex(index, key, entry) {
  if (!index.has(key)) index.set(key, []);
  index.get(key).push(entry);
}

function findWay(index, feature, direction) {
  const coords = feature.geometry.coordinates;
  const coordinate = direction === 0 ? coords[0] : coords[coords.length - 1];
  const key = coordKey(coordinate);

  const candidates = index.get(key) || [];
  const ways = [];
  let d = 0;

  for (const entry of candidates) {
    if (entry.feature.id === feature.id) continue; // saját magát ne találja meg
    ways.push(entry.feature);
    d = entry.atStart ? 1 : 0;
  }

  return { ways, direction: d };
}