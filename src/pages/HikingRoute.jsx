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

    
    const { geojson, loading, setVisited, cutWay, syncToSupabase, pendingEditsCount } = useGeojson();
    const { selectedWays } = useSelectedWays(geojson, selectedFeatureId);

    function handleClick(featureId){
        //setVisited(feature.id, true);
        setSelectedFeatureId(featureId);
    }

    // a térkép "cut-point" rétegén történő kattintásból érkezik: featureId = a vágandó way
    // valódi (OSM eredetű) feature.id-je, pointIndex = a way koordináta-tömbjének indexe,
    // ahol a vágás történjen
    const handleCutPoint = useCallback((featureId, pointIndex) => {
        cutWay(featureId, pointIndex);
        log.debug('cutWay', { featureId, pointIndex });
    }, [cutWay]);

    const handleConfirmVisited = useCallback((date) => {
        if (!selectedWaysView?.features?.length) return;

        const featureIds = selectedWaysView.features.map(f => f.id);
        setVisited(featureIds, true, date);

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
                        onCutPoint={handleCutPoint}
                    />
                </div>
                <div className='viewBox'>
                    <div className='buttonBox'>
                        
                    </div>
                    <div className='tableBox'>
                    <HikingRouteTable 
                        selectedWays={selectedWays}
                        setSelectedWaysView={setSelectedWaysView}
                        onSetVisited={handleConfirmVisited}
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