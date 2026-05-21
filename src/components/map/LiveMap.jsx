import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './LiveMap.css';
import styles from './LayerStyle.json';
import mokus from '../../assets/ikons/mokus.svg';
import car from '../../assets/ikons/car.svg';
import { LocateFixed, Locate } from './MapIcons';

export default function LiveMap ({geojson, planGeojson}) {

  const [is_center, set_is_center] = useState(true);
  const mapContainer = useRef(null);
  const map = useRef(null);
  const actPozition = useRef(null);
  const marker = useRef(null);
  const icon = useRef(null);
  const popup = useRef(null);
  const center = useRef(...styles.startPozition.center);
  
  // Terkep inicializalas
  useEffect(() => {
    if (map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/liberty', 
      ...styles.startPozition
    });
    // Terkep forgatas tiltas
    map.current.dragRotate.disable();
    map.current.touchZoomRotate.disableRotation(); 
    
    map.current.on('load', () => {

      // tervezett utvonal reteg
      map.current.addSource('planRoute', { type: 'geojson', data: { ...styles.geojson }});
      map.current.addLayer({ source: 'planRoute', ...styles.plan });

      // aktualis utvonal reteg
      map.current.addSource('route', { type: 'geojson', data: { ...styles.geojson }});
      map.current.addLayer({ source: 'route', ...styles.route });
    });

    // Map elmozdulas figyeles ikoncsere miatt
    map.current.on('moveend', (e) => {
      if (e.originalEvent) {
        set_is_center(false);
      }
    });

    //icon inic
    const el = document.createElement('img');
    el.src = mokus; el.style.width = '60px';el.style.height = '51px';
    el.style.cursor = 'pointer';
    icon.current = el;

    marker.current = new maplibregl.Marker({ element: el })
    .setLngLat([0,0])
    .addTo(map.current);

    return () => {
      if (map.current) {map.current.remove(); map.current = null;}
    };
  }, []);

  // LIVE utvonal kezeles
  useEffect(() => {
    if (!map.current || !geojson) return;

    // Terkep betoltes miatt szukseges
    const updateSource = () => {
      //meg nincs turapont
      if (geojson.features.length === 0) {
        popup.current = new maplibregl.Popup({closeButton: true,closeOnClick: false})
        .setLngLat(styles.startPozition.center)
        .setHTML(`<div>Túra még nem indult el.</div>`).addTo(map.current);
        map.current.flyTo({ ...styles.startPozition, speed: 0.8 });
        set_is_center(true);
      }
      //tura mar elindult
      else {
        const source = map.current.getSource('route');

        if (source) {
          source.setData(lineString(geojson));
        }

        // Tura meg nem indult el popup torles
        popup.current?.remove();

        // Aktualis pont megjelenites
        actPozition.current = geojson.features[geojson.features.length - 1].geometry.coordinates;
        // Ikon kivalasztas mokus v. auto
        geojson.features[geojson.features.length-1].properties.mode === 'hiking'
          ?icon.current.src = mokus:icon.current.src = car;
          
        const [lng, lat] = actPozition.current;
        marker.current?.setLngLat([parseFloat(lng), parseFloat(lat)]);
        map.current.flyTo({ center: [parseFloat(lng), parseFloat(lat)], zoom: 14, speed: 0.8 });
        set_is_center(true);
      }
    };

    // Terkep betolteset figyeli
    if (map.current.isStyleLoaded()) {
      updateSource();
    } else {
      map.current.once('load', updateSource);
    }

  }, [geojson]);

  // geojson pontonkent erkezik, mert
  // benne vannak az informaciok gsm, battery, idopontok,
  // de az utvonal kirajzolashoz linestring szukseges.
  function lineString(geoJson) {
  if (geoJson.features.length === 0) return geoJson;
  return {
    type: "FeatureCollection",
    features: [{
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: geoJson.features
          .filter((f) => f.properties.mode === 'hiking')
          .map((f) => f.geometry.coordinates)
      }
    }]
  };
}

  // Tervezett utvonal
  useEffect(() => {
    const updatePlan = () => {
      
      if(planGeojson.features.length > 0){
        const planSource = map.current.getSource('planRoute');
        if (planSource) {
          planSource.setData(planGeojson);
        }
      }
    }

    // Terkep betoltes figyeles
    if (map.current.isStyleLoaded()) {
      updatePlan();
    } else {
      map.current.once('load', updatePlan);
    }
  }, [planGeojson]);

  // Gombnyomasra az aktualis poziciora repul
  function setCenter(){
    let lat = 0; let lng = 0;
    if(geojson.features.length != 0){
      [lng, lat] = actPozition.current;
    }
    else {
      [lng, lat] = (styles.startPozition.center);
    }
    map.current.flyTo({ center: [parseFloat(lng), parseFloat(lat)], zoom: 15, speed: 0.5 });
    set_is_center(true);
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      <div style={{position: 'absolute',top: 10,right: 10,display: 'flex',flexDirection: 'column',gap: 8}}>
        <button style={{ padding: 0, lineHeight: 0 }} onClick={setCenter}>
          {is_center ? <LocateFixed /> : <Locate />}
        </button>
      </div>

    </div>
  );
}