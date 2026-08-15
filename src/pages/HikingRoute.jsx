import React, { useEffect, useRef, useState, useCallback } from 'react';
import './styles/HikingRoute.css';
import { useGeojson } from '../components/hikingRoute/useGeojson';
import { useSelectedWays } from '../components/hikingRoute/useSelectedWays';
import HikingRouteMap from '../components/hikingRoute/HikingRouteMap';
import HikingRouteTable from '../components/hikingRoute/HikingRouteTable';
import { gpxToGeoJSON } from '../utils/gpxToGeojson'
import ConfirmDialog from '../components/common/ConfirmDialog';
import logger from '../utils/Logger';
import LoggerPanel from '../utils/LoggerPanel';

const log = logger.scope("HikingRoute");

export default function HikingRoute(){
    //Térképen kijelölt szakasz
    const [selectedFeatureId, setSelectedFeatureId] = useState(null);
    //Táblázatban kijelölt szakaszok
    const [selectedWaysView, setSelectedWaysView] = useState(null);

    const [delConfirmed, setDelConfirmed] = useState(false);

    //Supabase storage-ből letöltött geojson
    const { geojson, loading, setVisited, cutWay, syncToSupabase, pendingEditsCount, forceRefresh } = useGeojson();

    const [ gpxGeojson, setGpxGeojson] = useState(null);

    //Térképen kijelölt szakasz kibővítve a következő elágazásig!
    const { selectedWays, selectedRelations } = useSelectedWays(geojson, selectedFeatureId);

    const fileInputRef = useRef(null);

    const handleGpxChange = async (event) => {
        const file = event.target.files?.[0];

        if (!file) return;

        try {
            const gpxText = await file.text();
            const g = gpxToGeoJSON(gpxText);

            setGpxGeojson(g);
            
        } catch (error) {
            console.error('Hiba a GPX beolvasásakor:', error);
        }
    };

    const handleClearGpx = () => {
        setGpxGeojson(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClick = (featureId) =>{
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
                        gpxGeojson={gpxGeojson}
                        selectedWaysView={selectedWaysView}
                        onFeatureClick={handleClick}
                        onCutPoint={handleCutPoint}
                    />
                </div>
                <div className='viewBox'>
                    <div className='buttonBox'>
                        <button className='btn'
                            onClick={() => setDelConfirmed(true)}>
                                Clear Database
                            </button>
                    </div>
                    <div className='buttonBox'>
                        <button
                            className='btn'
                            onClick={() => fileInputRef.current?.click()}
                        >Load GPX</button>
                        <button
                            className='btn'
                            onClick={handleClearGpx}
                        >Clear GPX</button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".gpx,application/gpx+xml"
                            onChange={handleGpxChange}
                            hidden
                        />
                    </div>
                    <div className='tableBox'>
                    <HikingRouteTable 
                        selectedWays={selectedWays}
                        selectedRelations={selectedRelations}
                        setSelectedWaysView={setSelectedWaysView}
                        onSetVisited={handleConfirmVisited}
                    />
                    </div>
                </div>
            </div>
            <div className='footer'> F O O T E R </div>

        </div>

        <ConfirmDialog
            open={delConfirmed}
            title="Megerősítés"
            text={
                'Adatbáztist biztosan törlöd"'
            }
            onCancel={() => setDelConfirmed(false)}
            onConfirm={() => {
                forceRefresh();
                setDelConfirmed(false);
            }}
        />

        <LoggerPanel />
        </>
    );
}