/*******************************************************************
* overpass-turbo.eu lekérdezésből készít geoJson adatokat!
*
* Lekérdezés:
* [out:json][timeout:25];
*    relation[route=hiking]({{bbox}}) -> .relations;
*  (
*    .relations;
*  );
* out geom({{bbox}});
*
* Optimalizált verzió: Map alapú way-kereséssel (O(1) az eredeti O(n) helyett),
* javított hibákkal és tömörebb, deklaratívabb kóddal.
*********************************************************************/

function overpassToGeoJson(overpass) {
	const geoJson = { "type": "FeatureCollection", "features": [] };

	// Map: wayId -> wayJson objektum, így O(1) a keresés/duplikátum-ellenőrzés
	const waysMap = new Map();
	let relationCount = 0;

	for (const element of overpass.elements) {
		if (element.type !== "relation") continue;

		const { minlon, minlat, maxlon, maxlat } = element.bounds;
		const relationBounds = [
			[minlon, minlat],
			[maxlon, minlat],
			[maxlon, maxlat],
			[minlon, maxlat],
			[minlon, minlat],
		];

		const waysRef = addWaysToMap(element, waysMap);

		const relationJson = {
			"type": "Feature",
			"properties": {
				"type": "relation",
				"name": element.tags.name,
				"ways": waysRef,
				"jel": element.tags.jel,
				"visited": false,
				"dirty": true,
			},
			"id": element.id,
			"geometry": { "type": "Polygon", "coordinates": [relationBounds] },
		};

		geoJson.features.push(relationJson);
		relationCount++;
	}

	let coordinatesCount = 0;
	for (const wayJson of waysMap.values()) {
		coordinatesCount += wayJson.geometry.coordinates.length;
		geoJson.features.push(wayJson);
	}

	console.log("Relations: " + relationCount);
	console.log("Ways: " + waysMap.size);
	console.log("Coordinates: " + coordinatesCount);

	return geoJson;
}

function addWaysToMap(relationElement, waysMap) {
	const waysRef = [];

	for (const member of relationElement.members) {
		if (member.type !== "way") continue;
		if (!hasValidGeometry(member.geometry)) continue;

		waysRef.push(member.ref);

		const existing = waysMap.get(member.ref);
		if (existing) {
			existing.properties.relations.push(relationElement.id);
			continue;
		}

		const coordinates = readWayGeo(member);
		const wayJson = {
			"type": "Feature",
			"properties": {
				"type": "way",
				"relations": [relationElement.id],
				"distance": calculateDistanceWay(coordinates),
				"visited": false,
				"visitedDates": [],
			},
			"geometry": { "type": "LineString", "coordinates": coordinates },
			"id": member.ref,
		};

		waysMap.set(member.ref, wayJson);
	}

	return waysRef;
}

function hasValidGeometry(geometry) {
	return geometry.some((point) => point != null);
}

function readWayGeo(member) {
	return member.geometry
		.filter((point) => point != null)
		.map((point) => [point.lon, point.lat]);
}

function calculateDistanceWay(coordinates) {
	let distance = 0;
	for (let i = 0; i < coordinates.length - 1; i++) {
		distance += calculateDistanceCoord(coordinates[i], coordinates[i + 1]);
	}
	return distance;
}

function calculateDistanceCoord(coord1, coord2) {
	const EARTH_RADIUS = 6371000;
	const toRadians = (degrees) => degrees * (Math.PI / 180);

	const lat1 = toRadians(coord1[1]);
	const lon1 = toRadians(coord1[0]);
	const lat2 = toRadians(coord2[1]);
	const lon2 = toRadians(coord2[0]);

	const dLat = lat2 - lat1;
	const dLon = lon2 - lon1;

	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return Math.round(EARTH_RADIUS * c);
}