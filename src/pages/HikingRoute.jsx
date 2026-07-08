import React, { useEffect, useRef, useState, useCallback } from 'react';

import './HikingRoute.css';
import HikingRouteMap from '../components/hikingRoute/HikingRouteMap';
import { supabase } from '../services/SupabaseClient';
import { useGeojson } from '../components/hikingRoute/useGeojson';
import { HikingRouteTable } from '../components/hikingRoute/HikingRouteTable';
import { useSelectedWays } from '../components/hikingRoute/useSelectedWays';

export default function HikingRoute(){
    const [selectedFeatureId, setSelectedFeatureId] = useState(null);
    const [selectedWaysView, setSelectedWaysView] = useState(null);
    
    const { geojson, loading, setVisited, syncToSupabase, pendingEditsCount } = useGeojson();
    const { selectedWays } = useSelectedWays(geojson, selectedFeatureId);

    if (loading) return <div>Betöltés...</div>;

    function handleClick(featureId){
        //setVisited(feature.id, true);
        setSelectedFeatureId(featureId);
    }

    return(
        <div className='hikingBox'>
            <div className='header'>Hiking Route v0.0</div>
            <div className='mainBox'>
                <div className='mapBox'>
                    <HikingRouteMap 
                        geojson={geojson}
                        selectedWaysView={selectedWaysView}
                        onFeatureClick={(f) => handleClick(f)}
                    />
                </div>
                <div className='viewBox'>
                    <div className='buttonBox'>GOMB</div>
                    <div className='tableBox'>
                    <HikingRouteTable 
                        selectedWays={selectedWays}
                        setSelectedWaysView={setSelectedWaysView}
                    />
                    </div>
                </div>
            </div>
            <div className='footer'> F O O T E R </div>

        </div>
    );
}