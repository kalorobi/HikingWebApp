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
/*export function findWays(geojson, feature){

	let ways = {"type" : "FeatureCollection", "features" : [feature]};
	let way = feature;
	let directionLeft = false; let direction = 0; let directionRight = false;
	while(!directionLeft){
		let w = findWay(geojson, way, direction);
		if(w.ways.length === 1){
			ways.features.unshift(w.ways[0]);
			way = w.ways[0];
			direction = w.direction;
		}
		else {directionLeft = true;}
	}
	direction = 1; way = feature;
	while(!directionRight){
		let w = findWay(geojson, way, direction);
		if(w.ways.length === 1){
			ways.features.push(w.ways[0]);
			way = w.ways[0];
			direction = w.direction;
		}
		else {directionRight = true;}
	}
	return ways;
}
function findWay(geosjson, feature, direction){
	const coordinate = direction === 0 
        ? feature.geometry.coordinates[0]
        : feature.geometry.coordinates[feature.geometry.coordinates.length-1];
	let d = 0;
	const ways = geosjson.features.filter((f) => {
		if(f.properties.type === 'way' && f.id !== feature.id){
			if(coordinate[0] === f.geometry.coordinates[0][0]
                && coordinate[1] === f.geometry.coordinates[0][1]
            ){
				d = 1;
				return true;
			}
            if(coordinate[0] === f.geometry.coordinates[f.geometry.coordinates.length-1][0]
                && coordinate[1] === f.geometry.coordinates[f.geometry.coordinates.length-1][1]
            ){
				d = 0;
				return true;
			}
		}
	});
	return { "ways" : ways, "direction" : d};
}*/