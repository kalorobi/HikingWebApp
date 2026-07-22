import { Fragment, useEffect, useRef, useState } from 'react';
import {Map as MapView, Source, Layer, Marker, Popup} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { Mountains } from './LIvePlanMountains';
import { centerOfMass } from '@turf/center-of-mass';
import { destination } from "@turf/destination";
import { point } from '@turf/helpers';
import MapMarker from './MapMarker';

export default function LivePlanMap({plans, setSelectedPlan}){

    const mapRef = useRef(null);
    const mapPlans = useRef(null);
    const [selectedPoint, setSelectedPoint] = useState(null);
    const [coordinates, setCoordinates] = useState(new Map());

    useEffect(() => {
        if(!plans) return;
        const tempCoord = new Map();
        plans.forEach( plan => {
            if(plan.geojson?.features?.length > 0){
                const feature = centerOfMass(plan.geojson);
                tempCoord.set(plan.id, feature.geometry.coordinates)
            }
            else{
                const po = point(
                    [Mountains[plan.mountain]?.lng || 0, 
                    Mountains[plan.mountain]?.lat || 0]
                );
                const bearing = (Math.floor(Math.random() * 25) * 15 ) -180;
                const desc = Math.floor(Math.random() * 100) + 100;

                const dest = destination(po, desc, bearing, { units: "meters" });
                tempCoord.set(plan.id, dest.geometry.coordinates);
            }
        })

        setCoordinates(tempCoord);
    },[plans])

    return (
       <MapView
            style={{ width: '100%', height: '100%' }}
            reuseMaps ref={mapRef} dragRotate={false}
            onLoad={() => {
                const map = mapRef.current?.getMap();
                map?.touchZoomRotate.disableRotation();
            }}
            initialViewState={{
                longitude: 19.826587,
                latitude: 47.9263058,
                zoom: 12
            }}
            mapStyle="https://tiles.openfreemap.org/styles/bright"
        >

        {plans?.map((plan) => (
            <Fragment key={plan.id}>
                    
                <Marker
                    longitude={coordinates.get(plan.id)?.[0] || 0}
                    latitude={coordinates.get(plan.id)?.[1] || 0}
                    anchor="center"
                    onClick={(e) => {
                        e.originalEvent.stopPropagation();
                        setSelectedPlan(plan);
                    }}
                >
                    <MapMarker id={plan.id} text={plan.plan_name} />
                </Marker>

                {/* GeoJSON réteg */}
                {plan?.geojson?.features?.length > 0 && (
                    <Source id={`geojson-${plan.id}`}type="geojson" data={plan.geojson}>
                        <Layer
                            id={`geojson-line-${plan.id}`}
                            type="line"
                            paint={{
                                'line-color':  plan.is_active? '#7A9E6F': '#D4813A',
                                'line-width': 3
                            }}
                            filter={["==", "$type", "LineString"]}
                        />

                        <Layer
                            id={`geojson-point-${plan.id}`}
                            type="circle"
                            paint={{
                                'circle-radius': 5,
                                'circle-color': '#D4813A'
                            }}
                            filter={["==", "$type", "Point"]}
                        />
                    </Source>
                )}

            </Fragment>
        ))}

        <Tooltip id="map-tooltip" />

        </MapView>
    )
}