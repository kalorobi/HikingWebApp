import { act, useEffect, useRef, useState } from 'react';
import {Map, Source, Layer, Marker, Popup} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import './LiveMap.css';
import mapStyles from './LiveMapStyles.json';
import mokus from '../../assets/ikons/mokus.svg';
import car from '../../assets/ikons/car.svg'
import { LocateFixed, Locate, MapLayer, Refress } from '../../assets/ikons/MapIcons';

export default function LiveMap({geojson, refress, auth}) {
  
  const [lastPoint, setLastPoint] = useState(null);
  const mapRef = useRef(null);
  const [showPopup, setShowPopup] = useState({
    "show": true, 
    "txt": "Túra még nem indult el!",
    "longitude": 19.826587,
    "latitude": 47.9263058,
  });
  const [zoom, setZoom] = useState(0);
  const [is_center, setIs_center] = useState(true);
  const [activeStyle, setActiveStyle] = useState(mapStyles.layers[0]);

  useEffect(() => {

    const hasPoint = geojson?.features?.some(
      f => f.geometry?.type === 'Point'
    );
    if (hasPoint) {setShowPopup(prev => ({...prev, show:false}));}
    
    const lastPointFeature = geojson?.features
      ?.slice()
      .reverse()
      .find(f => f.geometry?.type === 'Point');

    if (!lastPointFeature) return;

    setLastPoint({...lastPointFeature});
  }, [geojson, auth]);

  useEffect(() => {
    if (!lastPoint) return;

    mapRef.current?.getMap().easeTo({
      center: [lastPoint.geometry.coordinates[0], lastPoint.geometry.coordinates[1]],
      zoom: 15, duration: 2000
    });
    setIs_center(true);
  }, [lastPoint]);

  function toCeneter(e){
    if (!lastPoint) return;

    mapRef.current?.getMap().easeTo({
      center: [lastPoint.geometry.coordinates[0], lastPoint.geometry.coordinates[1]],
      zoom: 15, duration: 2000
    });
    setIs_center(true);
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
    <Map
      reuseMaps
      ref={mapRef}
      dragRotate={false}
      onLoad={() => {
        const map = mapRef.current?.getMap();
        map?.touchZoomRotate.disableRotation();
      }}
      onMoveEnd={(e) => {if (e.originalEvent) {setIs_center(false);}}}
      onZoom={(e) => {setZoom(e.viewState.zoom);}}
      initialViewState={{ ...mapStyles.mapCenter }}
      style={{ width: '100%', height: '100%' }}
      mapStyle={activeStyle.style}
    >
    <Source id="planned-source" type="geojson" data={geojson}>
      <Layer id="planned" type="line"
        filter={['==', ['get', 'routeType'], 'planned']}
        paint={{ 'line-color': '#D4813A','line-width': 3}}
      />
    </Source>
     <Source id="live-flat" type="geojson" data={geojson}>
      <Layer id="flat" type="line"
        filter={['==', ['get', 'routeType'], 'live-flat']}
        paint={{ 'line-color': '#5B8FA8','line-width': 3}}
      />
    </Source>
    <Source id="live-source" type="geojson" data={geojson}>
      <Layer id="live" type="line"
        filter={['==', ['get', 'routeType'], 'live']}
        paint={{ 'line-color': '#3A8D60','line-width': 3}}
      />
      <Layer id="live-points" type="circle"
        minzoom={13}
        filter={['==', ['geometry-type'], 'Point']}
        paint={{ 'circle-radius': 4, 'circle-color': '#3A8D60'}}
      />
      <Layer
        id="live-labels"
        type="symbol"
        minzoom={13}
        filter={['==', ['geometry-type'], 'Point']}
        layout={{
          'text-field': ['get', 'timeLabel'],
          'text-size': 10,
          'text-anchor': 'bottom',
          'text-offset': [0, -0.8],
        }}
        paint={{
          'text-color': '#4A2E1F',
          'text-halo-color': '#fff',
          'text-halo-width': 1,
        }}
      />
    </Source>
    {showPopup.show && (
      <Popup
        longitude={showPopup.longitude}
        latitude={showPopup.latitude}
        anchor="bottom"
        onClose={() => setShowPopup(prev => ({...prev, show: false}))}
      >
       <div>
        {showPopup.txt}
      </div>
      </Popup>
    )}
    {lastPoint && (
      <Marker
        longitude={lastPoint.geometry.coordinates[0]}
        latitude={lastPoint.geometry.coordinates[1]}
      >
        <img src={
          lastPoint.properties.mode === 'hiking'
            ? mokus
            : car
          } alt="plane" width={60*zoom/12} height={51*zoom/12}/>
      </Marker>
    )}
    </Map>

     <div style={{position: 'absolute', right: 16, top: 16, display: 'flex',flexDirection: 'column',
        gap: 8, zIndex: 10}}>
        <button style={{ padding: 0, lineHeight: 0 }} onClick={toCeneter}>
          {is_center ? <LocateFixed /> : <Locate />}
        </button>
        <button style={{ padding: 0, lineHeight: 0 }} onClick={() => {
          activeStyle.id === "openfreemap" ? 
            setActiveStyle(mapStyles.layers[1]) :  setActiveStyle(mapStyles.layers[0]);          
        }}>
          <MapLayer />
        </button>
        <button style={{ padding: 0, lineHeight: 0 }} onClick={refress}>
          <Refress />
        </button>
        <div style={{fontSize: 10, textAlign: 'center', padding: 2, color: '#6f4e37', backgroundColor: '#ffffff'}}>{zoom.toFixed(1)}</div>
    </div>
    </div>
  );
}