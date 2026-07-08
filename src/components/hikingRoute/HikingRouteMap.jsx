import { useEffect, useRef, useState } from 'react';
import { Map, Source, Layer, useMap } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import bbox from '@turf/bbox';

export default function HikingRouteMap({ geojson, selectedWaysView, onFeatureClick }) {
  const mapRef = useRef(null);
  const [cursor, setCursor] = useState('auto');

  useEffect(() => {
    if (!selectedWaysView || !selectedWaysView.features?.length || !mapRef.current) return;

    const [minLng, minLat, maxLng, maxLat] = bbox(selectedWaysView);

    mapRef.current.fitBounds(
      [[minLng, minLat],[maxLng, maxLat],],
      {padding: 40, duration: 1000, maxZoom: 16,}
    );
  }, [selectedWaysView]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Map
        reuseMaps
        ref={mapRef}
        dragRotate={false}
        cursor={cursor}
        interactiveLayerIds={['way-hitbox']}
        onLoad={() => {
          mapRef.current?.getMap()?.touchZoomRotate.disableRotation();
        }}
        onClick={(e) => {
          if(e.features.length === 0) return;
          const featureId = e.features?.[0].id;

          if (!featureId) return;
          onFeatureClick(featureId);
        }}
        onContextMenu={(e) => {
          const feature = e.features?.[0];

          if (feature) {
            console.log("Jobb klikk a layeren:", feature);
          }
        }}
        initialViewState={{ longitude: 19.826587, latitude: 47.9263058, zoom: 12 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="https://tiles.openfreemap.org/styles/bright"
      >
        <Source
          id="way-source"
          type="geojson"
          data={geojson}
          promoteId="uid"
        >
          <Layer
            id="way-hitbox"
            type="line"
            filter={['==', ['get', 'type'], 'way']}
            paint={{
              'line-color': 'transparent',
              'line-width': 20
            }}
          />
          <Layer
            id="hiking"
            type="line"
            filter={['all', ['==', ['get', 'type'], 'way'], ['!=', ['get', 'visited'], true]]}
            paint={{ 'line-color': '#D4813A', 'line-width': 2 }}
          />
          <Layer
            id="hiking-visited"
            type="line"
            filter={['all', ['==', ['get', 'type'], 'way'], ['!=', ['get', 'visited'], false]]}
            paint={{ 'line-color': '#FDFF24', 'line-width': 4, "line-opacity": 0.5 }}
          />
        </Source>
        {selectedWaysView && (<Source
          id="way-selected"
          type="geojson"
          data={selectedWaysView}
        >
           <Layer
            id="selected-layer"
            type="line"
            paint={{ 'line-color': 'red', 'line-width': 4 }}
          />
          <Layer
            id="selected-layer-label"
            type="symbol"
            minzoom={13}
            layout={{
              'text-field': ['get', 'uid'],
              'text-size': {
                base: 1,
                stops: [[13, 10],[16, 10],[20, 22]]
              },
              'text-anchor': 'bottom',
              'text-offset': [0, -0.8],
              }}
            paint={{
              'text-color': '#4A2E1F',
              'text-halo-color': '#fff',
              'text-halo-width': 1,
            }}
          />
        </Source>)}


      </Map>
    </div>
  );
}