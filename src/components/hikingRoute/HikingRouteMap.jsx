import { useEffect, useRef, useState } from 'react';
import { Map, Source, Layer, useMap } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function HikingRouteMap({ geojson, selectedFeatures, onFeatureClick }) {
  const mapRef = useRef(null);
  const [cursor, setCursor] = useState('auto');

  function handleClick(featureId){
    onFeatureClick(featureId);
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Map
        reuseMaps
        ref={mapRef}
        dragRotate={false}
        cursor={cursor}
        interactiveLayerIds={['way-hitbox']}
        onClick={(e) => {
            const featureId = e.features?.[0].id;
            if (!featureId) return;

            handleClick(featureId);
        }}
        onLoad={() => {
          mapRef.current?.getMap()?.touchZoomRotate.disableRotation();
        }}
        initialViewState={{ longitude: 19.826587, latitude: 47.9263058, zoom: 12 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="https://tiles.openfreemap.org/styles/bright"
      >
        <Source
          id="way-source"
          type="geojson"
          data={geojson}
          promoteId="uid" //maplibre string id-t torli, ezert kell uid
        >
            <Layer
                id="way-hitbox"
                type="line"
                filter={['==', ['get', 'type'], 'way']}
                paint={{
                    'line-color': 'transparent',
                    'line-width': 20  // px-ben, ennyi széles a kattintható sáv
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
            paint={{ 'line-color': '#7A9E6F', 'line-width': 2 }}
          />
        </Source>
        {selectedFeatures && (<Source
          id="way-selected"
          type="geojson"
          data={selectedFeatures[0]}
        >
           <Layer
            id="selected-layer"
            type="line"
            paint={{ 'line-color': 'red', 'line-width': 4 }}
          />
        </Source>)}


      </Map>
    </div>
  );
}