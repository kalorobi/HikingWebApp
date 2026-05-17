import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './LiveMap.css';
import styles from './LayerStyle.json'
import mokus from '../../assets/ikons/mokus.svg'

export default function LiveMap ({geojson, planGeojson}) {

  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const popup = useRef(null);
  const agasvar = [19.826587,47.9263058];

  // geojson pontonkent erkezik, mert
  // benne vannak az informaciok gsm, battery, idopontok,
  // de az utvonal kirajzolashoz linestring szukseges.
  function lineString (geoJson) {
    if(geoJson.features.length === 0) return geoJson;
    return {
        type: "FeatureCollection",properties: {},
        features: [{type: "Feature", geometry : {type: "LineString",
          coordinates : geoJson.features.map(f => f.geometry.coordinates)
        }}]
    }
  }
  
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

    const el = document.createElement('img');
    el.src = mokus; el.style.width = '60px';el.style.height = '51px';
    el.style.cursor = 'pointer';
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
        .setLngLat(agasvar)
        .setHTML(`<div>Túra még nem indult el.</div>`).addTo(map.current);
        map.current.flyTo({ ...styles.startPozition, speed: 0.8 });
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
        const last = geojson.features[geojson.features.length - 1];
        const [lng, lat] = last.geometry.coordinates;
        marker.current?.setLngLat([parseFloat(lng), parseFloat(lat)]);
        map.current.flyTo({ center: [parseFloat(lng), parseFloat(lat)], zoom: 14, speed: 0.5 });
      }
    };

    // Terkep betolteset figyeli
    if (map.current.isStyleLoaded()) {
      updateSource();
    } else {
      map.current.once('load', updateSource);
    }

  }, [geojson]);

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
  }, [planGeojson])

  return <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />;
}