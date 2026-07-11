import { useEffect, useRef, useState } from 'react';
import { Map, Source, Layer, useMap } from 'react-map-gl/maplibre';
import * as mapLayers from './HikingRouteMapLayers';
import 'maplibre-gl/dist/maplibre-gl.css';
import bbox from '@turf/bbox';
import { wayHitbox } from './HikingRouteMapLayers';

export default function HikingRouteMap({ geojson, selectedWaysView, onFeatureClick }) {
  const mapRef = useRef(null);
  const [cutWay, setCutWay] = useState({"type": "FeatureCollection", features: []});
  const [cursor, setCursor] = useState('auto');

  useEffect(() => {
    if (!selectedWaysView || !selectedWaysView.features?.length || !mapRef.current) return;

    const [minLng, minLat, maxLng, maxLat] = bbox(selectedWaysView);

    mapRef.current.fitBounds(
      [[minLng, minLat],[maxLng, maxLat],],
      {padding: 40, duration: 1000, maxZoom: 16,}
    );
  }, [selectedWaysView]);

  //vonalra kattintas
  function clickFeature(e) {
    if(e.features.length === 0) return;
    const featureId = e.features?.[0].id;

    if (!featureId) return;
    onFeatureClick(featureId);
  }

  //jobb klik a vonalon
  function rightClickFeature(e){
    if(e.features.length === 0) return;
    const featureId = e.features?.[0].id;

    if (featureId) {
      const feature = geojson?.features?.filter(f => f.properties.uid === featureId);
      setCutWay(prew => ({...prew, features:[feature][0]}));
  }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Map
        reuseMaps ref={mapRef} cursor={cursor} {...mapLayers.baseMap}
        
        onLoad={() => {
          mapRef.current?.getMap()?.touchZoomRotate.disableRotation();
        }}
        onClick={clickFeature}
        onContextMenu={rightClickFeature}
      >
        <Source
          id="way-source" type="geojson"
          data={geojson} promoteId="uid"
        >
          <Layer
            id="way-hitbox" type="line"
            filter={['==', ['get', 'type'], 'way']}
            {...mapLayers.wayHitbox}
          />
          <Layer id="hiking" type="line"
            filter={['all', ['==', ['get', 'type'], 'way'], ['!=', ['get', 'visited'], true]]}
            {...mapLayers.hiking}
          />
          <Layer
            id="hiking-visited"
            type="line"
            filter={['all', ['==', ['get', 'type'], 'way'], ['!=', ['get', 'visited'], false]]}
            {...mapLayers.visited}
          />
        </Source>
        <Source id="way-selected" type="geojson" data={selectedWaysView ?? {...mapLayers.empty}}>
          <Layer id="selected-layer" type="line" {...mapLayers.selected} />
          <Layer id="selected-layer-label" type="symbol" {...mapLayers.selectedLabel}/>
        </Source>
        <Source id="way-cut" type="geojson" data={cutWay ?? {...mapLayers.empty}}>
          <Layer id="cut-layer" type="line" {...mapLayers.cut} />
          <Layer id="cut-point" type="circle" {...mapLayers.cutPoint} />
        </Source>

      </Map>
    </div>
  );
}