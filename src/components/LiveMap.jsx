import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function liveMap ({geojson}) {

  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const popup = useRef(null);
  const agasvar = [19.826587,47.9263058];

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
      center: agasvar,
      zoom: 12
    });

    map.current.dragRotate.disable();
    map.current.touchZoomRotate.disableRotation(); 
    
    map.current.on('load', () => {
      map.current.addSource('route', { type: 'geojson', data: { type: "FeatureCollection", features: [] }});
      map.current.addLayer({ id: 'route-layer', type: 'line', source: 'route', 
        paint: { 'line-color': '#c7f21c', 'line-width': 5 } });
    });

    marker.current = new maplibregl.Marker({ color: "#FF0000" })
    .setLngLat([0,0])
    .addTo(map.current);

    return () => {
      if (map.current) {map.current.remove(); map.current = null;}
    };
  }, []);

  useEffect(() => {
    if (!map.current || !geojson) return;

    const updateSource = () => {
      if (geojson.features.length === 0) {
        popup.current = new maplibregl.Popup({closeButton: true,closeOnClick: false})
        .setLngLat(agasvar)
        .setHTML(`<div>Túra még nem indult el.</div>`).addTo(map.current);
        map.current.flyTo({ center: agasvar, zoom: 14, speed: 0.8 });
      }
      else {
        const source = map.current.getSource('route');
        if (source) {
          source.setData(lineString(geojson));
        }
        popup.current?.remove();

        const last = geojson.features[geojson.features.length - 1];
        const [lng, lat] = last.geometry.coordinates;
        marker.current?.setLngLat([parseFloat(lng), parseFloat(lat)]);
        map.current.flyTo({ center: [parseFloat(lng), parseFloat(lat)], zoom: 14, speed: 0.5 });
      }
    };

    if (map.current.isStyleLoaded()) {
      updateSource();
    } else {
      map.current.once('load', updateSource);
    }

  }, [geojson]);

  return <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />;
}