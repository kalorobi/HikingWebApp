import { Mountains } from "./LIvePlanMountains";
import { centerOfMass } from '@turf/center-of-mass';
import { length } from '@turf/length';


export function planMap({planedRoutes}){

    function rndCoord(center, radiusMeters = 100) {
        const { lat, lng } = center;

        const angleStep = 15;
        const stepsCount = 360 / angleStep; // 24
        const angleDeg = Math.floor(Math.random() * stepsCount) * angleStep;
        const angle = (angleDeg * Math.PI) / 180; // fokból radián

        const dx = radiusMeters * Math.cos(angle);
        const dy = radiusMeters * Math.sin(angle);

        const earthRadius = 6378137;

        const deltaLat = (dy / earthRadius) * (180 / Math.PI);
        const deltaLng = (dx / (earthRadius * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI);

        return {
            lat: lat + deltaLat,
            lng: lng + deltaLng,
        };
    }
    function calcCoord(plan) {
        const planLine = plan.geojson?.features?.find(
            f => f.geometry?.type === "LineString"
        );

        if (!planLine?.geometry?.coordinates?.length) {
            const {lat, lng} = rndCoord({
                lat: Mountains[plan.mountain].lat,
                lng: Mountains[plan.mountain].lng,
            })
            return {
                lat: lat,
                lng: lng,
                data: plan,
                distance: 0,
            };
        }

        const feature = centerOfMass(planLine);
        const distance = length({type: 'FeatureCollection', features:[planLine]});

        return {
            lat: feature.geometry.coordinates[1],
            lng: feature.geometry.coordinates[0],
            data: plan,
            distance: distance,
        };
    }

    const routeCoords = new Map();

    planedRoutes.forEach(plan => {
        const coord = calcCoord(plan);

        if (coord) {
            routeCoords.set(plan.id, coord);
        }
    });

    return routeCoords;
}