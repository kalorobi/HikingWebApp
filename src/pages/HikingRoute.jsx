import React, { useEffect, useRef, useState, useCallback } from 'react';

import './HikingRoute.css';
import HikingRouteMap from '../components/hikingRoute/HikingRouteMap';
import { supabase } from '../services/SupabaseClient';
import { useGeojson } from '../components/hikingRoute/useGeojson';
import { HikingRouteTable } from '../components/hikingRoute/HikingRouteTable';


export default function HikingRoute(){
    const [selectedFeatures, setSelectedFeatures] = useState(null);
    
    const { geojson, loading, setVisited, syncToSupabase, pendingEditsCount } = useGeojson();

    if (loading) return <div>Betöltés...</div>;

    function handleClick(featureId){
        //setVisited(feature.id, true);
        const s = geojson.features.filter(f => f.properties.uid === featureId)
        setSelectedFeatures(s);
    }

    return(
        <div className='hikingBox'>
            <div className='header'>Hiking Route v0.0</div>
            <div className='mainBox'>
                <div className='mapBox'>
                    <HikingRouteMap 
                        geojson={geojson}
                        selectedFeatures={selectedFeatures}
                        onFeatureClick={(f) => handleClick(f)}
                    />
                </div>
                <div className='tableBox'>
                    <HikingRouteTable 
                        features={selectedFeatures}
                        onSetVisited={(f,e) => setVisited(f,e)}
                    />
                </div>
            </div>
            <div className='footer'> F O T E R </div>

        </div>
    );
}