import { useEffect, useMemo, useRef, useState } from 'react';
import { Map, Source, Layer } from 'react-map-gl/maplibre';
import * as mapLayers from './HikingRouteMapLayers';
import 'maplibre-gl/dist/maplibre-gl.css';
import bbox from '@turf/bbox';

export default function HikingRouteMap({ geojson, selectedWaysView, onFeatureClick, onCutPoint }) {

  const mapRef = useRef(null);
  // cutPreview: csak a JOBB KLIKKEL kiválasztott way vizuális előnézete (a "vágóvonal" és a rajta
  // lévő pontok), NEM azonos a useGeojson hook cutWay(featureId, pointIndex) dispatch függvényével!
  const [cutPreview, setCutPreview] = useState({ type: "FeatureCollection", features: [] });
  const [cursor, setCursor] = useState('auto');
  const hoveredPointId = useRef(null);

  useEffect(() => {
    if (!selectedWaysView || !selectedWaysView.features?.length || !mapRef.current) return;

    const [minLng, minLat, maxLng, maxLat] = bbox(selectedWaysView);

    mapRef.current.fitBounds(
      [[minLng, minLat], [maxLng, maxLat]],
      { padding: 40, duration: 1000, maxZoom: 16 }
    );
  }, [selectedWaysView]);

  // a cutWay vonal csomópontjaiból pont-FeatureCollection, index alapú id-vel
  const cutWayPoints = useMemo(() => {
    const line = cutPreview?.features?.[0];
    if (!line || line.geometry?.type !== 'LineString') {
      return { type: "FeatureCollection", features: [] };
    }
    return {
      type: "FeatureCollection",
      features: line.geometry.coordinates.map((coord, idx) => ({
        type: "Feature",
        id: idx,
        geometry: { type: "Point", coordinates: coord },
        // parentId: a way valódi (OSM) azonosítója - EZT kell tovább adni a vágás dispatch-nek.
        // parentUid: csak diagnosztikai/debug célra, a maplibre-s uid-ra hivatkozva
        properties: { idx, parentId: line.id, parentUid: line.properties.uid }
      }))
    };
  }, [cutPreview]);

  //vonalra vagy vágópontra kattintas
  function clickFeature(e) {
    if (e.features.length === 0) return;

    // vágópontra kattintás elsőbbséget élvez a vonal kijelölésével szemben
    const pointFeature = e.features.find(f => f.layer.id === 'cut-point');
    if (pointFeature) {
      const { idx, parentId } = pointFeature.properties;
      onCutPoint?.(parentId, idx);
      setCutPreview({ type: "FeatureCollection", features: [] });
      return;
    }

    // a Source-on promoteId="uid" van beállítva, ezért e.features[0].id itt a
    // properties.uid (maplibre-s belső id), NEM a valódi OSM feature.id!
    // vissza kell fordítani a geojson-ban a valódi id-re, mielőtt felmegy a szülőhöz.
    const clickedUid = e.features?.[0].id;
    if (clickedUid === undefined || clickedUid === null) return;

    const clickedFeature = geojson?.features?.find(f => f.properties.uid === clickedUid);
    if (!clickedFeature) return;

    setCutPreview(prev => ({ ...prev, features: [] }));
    onFeatureClick(clickedFeature.id);
  }

  //jobb klik a vonalon
  function rightClickFeature(e) {
    if (e.features.length === 0) return;
    const featureId = e.features?.[0].id;
    if (!featureId) return;

    // a uid egyedi, ezért .find-ot használunk (nem .filter-t) - egyetlen
    // feature-t adunk vissza, nem egy egyelemű tömböt becsomagolva
    const feature = geojson?.features?.find(f => f.properties.uid === featureId);
    if (!feature) return;

    setCutPreview(prev => ({ ...prev, features: [feature] }));
  }

  // hover kezelése a vágópontokon (feature-state alapú, nincs re-render minden mozdulatnál)
  function handleMouseMove(e) {
    const pointFeature = e.features?.find(f => f.layer.id === 'cut-point');
    const map = mapRef.current?.getMap();

    if (hoveredPointId.current !== null) {
      map?.setFeatureState(
        { source: 'way-cut-points', id: hoveredPointId.current },
        { hover: false }
      );
      hoveredPointId.current = null;
    }

    if (pointFeature) {
      setCursor('pointer');
      hoveredPointId.current = pointFeature.id;
      map?.setFeatureState(
        { source: 'way-cut-points', id: pointFeature.id },
        { hover: true }
      );
    } else {
      setCursor('auto');
    }
  }

  function handleMouseLeave() {
    const map = mapRef.current?.getMap();
    if (hoveredPointId.current !== null) {
      map?.setFeatureState(
        { source: 'way-cut-points', id: hoveredPointId.current },
        { hover: false }
      );
      hoveredPointId.current = null;
    }
    setCursor('auto');
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
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
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
            filter={['all', ['==', ['get', 'type'], 'way'], ['==', ['get', 'visited'], true]]}
            {...mapLayers.visited}
          />
        </Source>
        <Source id="way-selected" type="geojson" data={selectedWaysView ?? { ...mapLayers.empty }}>
          <Layer id="selected-layer" type="line" {...mapLayers.selected} />
          <Layer id="selected-layer-label" type="symbol" {...mapLayers.selectedLabel} />
        </Source>
        <Source id="way-cut" type="geojson" data={cutPreview ?? { ...mapLayers.empty }}>
          <Layer id="cut-layer" type="line" {...mapLayers.cut} />
        </Source>
        <Source id="way-cut-points" type="geojson" data={cutWayPoints} promoteId="idx">
          <Layer id="cut-point" type="circle" {...mapLayers.cutPoint} />
        </Source>

      </Map>
    </div>
  );
}