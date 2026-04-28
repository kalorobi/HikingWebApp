import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function liveMap ({geojson}) {

  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const popup = useRef(null);

  function lineString (geoJson) {
    if(geojson.features.length === 0) return geojson;
    return {
        type: "FeatureCollection",
        properties: {},
        features: [{
          type: "Feature",
          geometry : {
            type: "LineString",
            coordinates : geoJson.features.map(f => f.geometry.coordinates)
          }
        }]
      }
  }
  // --- 1. Térkép inicializálása (Csak egyszer fut le) ---
  useEffect(() => {
    if (map.current) return; // Ha már létezik a térkép, ne építsük újra
      
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/liberty', 
      center: [19.0402, 47.4979],
      zoom: 12
    });
    
    map.current.on('load', () => {
      //UTVONAL LAYER
      map.current.addSource('route', { type: 'geojson', data: lineString(geojson)});
      map.current.addLayer({ id: 'route-layer', type: 'line', source: 'route', 
        paint: { 'line-color': '#c7f21c', 'line-width': 5 } });
    });

    // Kezdő marker (láthatatlanul, amíg nincs adat)
    marker.current = new maplibregl.Marker({ color: "#FF0000" })
    .setLngLat([19.826587,47.9263058])
    .addTo(map.current);
    popup.current = new maplibregl.Popup({closeButton: true,closeOnClick: false})
    .setLngLat([19.826587,47.9263058])
    .setHTML(`
      <div>Túra még nem indult el.</div>
    `).addTo(map.current);
    map.current.flyTo({ center: [19.826587,47.9263058], speed: 0.8 });

      
    // Takarítás az oldal elhagyásakor
    return () => {
      if (map.current) {map.current.remove();map.current = null;}
    };
  }, []);

  useEffect(() => {

    if (!map.current) return;

    if (marker.current && map.current && geojson.features.length > 0) {
      const len = geojson.features.length - 1;
      const lat = parseFloat(geojson.features[len].geometry.coordinates[1]);
      const lng = parseFloat(geojson.features[len].geometry.coordinates[0]);
      marker.current.setLngLat([lng, lat]);
      map.current.flyTo({ center: [lng, lat], speed: 0.5 });
      
      if (!map.current.isStyleLoaded()) {return;}
      else {
        map.current.getSource("route").setData(lineString(geojson));
      }
    }
  },[geojson]);


  return <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />;
}