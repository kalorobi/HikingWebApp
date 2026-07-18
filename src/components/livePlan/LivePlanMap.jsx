import { Fragment, useEffect, useRef, useState } from 'react';
import {Map, Source, Layer, Marker, Popup} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { Mountains } from './LIvePlanMountains';
import MapMarker from './MapMarker';

export default function LivePlanMap({plans, setSelectedPlan}){

    const mapRef = useRef(null);
    const [selectedPoint, setSelectedPoint] = useState(null);

    useEffect(() => {
        console.log(selectedPoint);
    },[selectedPoint])

    return (
       <Map
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

        {[...plans].map(([id, plan]) => (
            <Fragment key={id}>

                {/* Marker */}
                <Marker
                    longitude={plan.lng}
                    latitude={plan.lat}
                    anchor="center"
                    onClick={(e) => {
                        e.originalEvent.stopPropagation();
                        setSelectedPlan(plan);
                    }}
                >
                    <MapMarker id={id} text={plan.data.plan_name} />
                </Marker>


                {/* GeoJSON réteg */}
                {plan.data.geojson?.features?.length > 0 && (
                    <Source id={`geojson-${id}`}type="geojson" data={plan.data.geojson}>
                        <Layer
                            id={`geojson-line-${id}`}
                            type="line"
                            paint={{
                                'line-color':  plan.data.is_active? '#7A9E6F': '#D4813A',
                                'line-width': 3
                            }}
                            filter={["==", "$type", "LineString"]}
                        />

                        <Layer
                            id={`geojson-point-${id}`}
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

        </Map>
    )
}