import React, { useEffect, useRef, useState, useCallback } from 'react';
import './HikingRoute.css';
import HikingRouteMap from '../components/hikingRoute/HikingRouteMap';
import { supabase } from '../services/SupabaseClient';
import { useGeojson } from '../components/hikingRoute/useGeojson';
import { HikingRouteTable } from '../components/hikingRoute/HikingRouteTable';
import { useSelectedWays } from '../components/hikingRoute/useSelectedWays';
import logger from '../utils/Logger';
import LoggerPanel from '../utils/LoggerPanel';

const log = logger.scope("HikingRoute");

export default function HikingRoute(){
    const [selectedFeatureId, setSelectedFeatureId] = useState(null);
    const [selectedWaysView, setSelectedWaysView] = useState(null);
    
    const { geojson, loading, setVisited, syncToSupabase, pendingEditsCount } = useGeojson();
    const { selectedWays } = useSelectedWays(geojson, selectedFeatureId);

    function handleClick(featureId){
        //setVisited(feature.id, true);
        setSelectedFeatureId(featureId);
    }
    const handleConfirmVisited = useCallback(() => {
        
        if (!selectedWaysView?.features?.length) return;

        const featureIds = selectedWaysView.features.map((f) => f.id);
        const today = "2025-10-28"//new Date().toISOString().slice(0, 10);

        setVisited(featureIds, true, today);
        log.debug('setVisited');

    }, [selectedWaysView, setVisited]);

    if (loading) return <div>Betöltés...</div>;
    return(
        <>
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
                    <div className='buttonBox'>
                        <button onClick={handleConfirmVisited} disabled={!selectedWaysView?.features?.length}>
                            ok
                        </button>
                    </div>
                    <div className='tableBox'>
                    <HikingRouteTable 
                        selectedWays={selectedWays}
                        setSelectedWaysView={setSelectedWaysView}
                        onSetVisited={setVisited}
                    />
                    </div>
                </div>
            </div>
            <div className='footer'> F O O T E R </div>

        </div>

        <LoggerPanel />
        </>
    );
}