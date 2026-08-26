import React, { useEffect, useRef, useState, useCallback } from 'react';
import './styles/HikingRoute.css';
import { useGeojson } from '../components/hikingRoute/useGeojson';
import { useSelectedWays } from '../components/hikingRoute/useSelectedWays';
import HikingRouteMap from '../components/hikingRoute/HikingRouteMap';
import HikingRouteTable from '../components/hikingRoute/HikingRouteTable';
import { gpxToGeoJSON } from '../utils/gpxToGeojson';
import { Tooltip } from 'react-tooltip';
import { Icon } from '../assets/ikons/MapIcons';
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
    const [uploadConfirmed, setUploadConfirmed] = useState(false);

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
            g.features[0].properties.name = file.name;

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

    const handleFeatureClick = (featureId) =>{
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
            <div className='header'>
              H E A D E R
            </div>
            <div className='mainBox'>
                <div className='mapBox'>
                    <HikingRouteMap 
                        geojson={geojson}
                        gpxGeojson={gpxGeojson}
                        selectedWaysView={selectedWaysView}
                        onFeatureClick={handleFeatureClick}
                        onCutPoint={handleCutPoint}
                    />
                </div>
                <div className='viewBox'>
                    <div className='menuBox'>
                        <Icon name='route' scale={0.8} onClick={() => fileInputRef.current?.click()}
                            color='#F2E7D5'
                            data-tooltip-id="hiking-tooltip"
                            data-tooltip-content="GPX betöltés"
                        />
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".gpx,application/gpx+xml"
                            onChange={handleGpxChange}
                            hidden
                        />
                        <Icon name='route_off' scale={0.8} onClick={handleClearGpx}
                            color='#F2E7D5'
                            data-tooltip-id="hiking-tooltip"
                            data-tooltip-content="GPX törlés"
                        />
                        <Icon name='database_del' scale={0.8} onClick={() => setDelConfirmed(true)}
                            color='#F2E7D5'
                            data-tooltip-id="hiking-tooltip"
                            data-tooltip-content="Helyi adatbázis törlés"
                        />
                        <Icon name='upload' scale={0.8} onClick={() => setUploadConfirmed(true)}
                            color='#F2E7D5'
                            data-tooltip-id="hiking-tooltip"
                            data-tooltip-content="Feltöltés"
                            style={{marginLeft: 'auto'}}
                        />

                        <Tooltip id="hiking-tooltip" className='hikingTooltip' place="bottom"/>

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
            <div className='footer'>Letöltött geojson: {geojson.metadata.created_at}</div>
        </div>

        <ConfirmDialog
            open={delConfirmed}
            title='Törlés'
            text={`A helyi adatbázisban ${pendingEditsCount} módosítás van.\nBiztosan folytatod?`}
            onCancel={() => setDelConfirmed(false)}
            onConfirm={() => {
                forceRefresh();
                setDelConfirmed(false);
            }}
        />

        <ConfirmDialog
            open={uploadConfirmed}
            title='Feltöltés'
            text={`Adatok feltöltése az adatbázisba?`}
            onCancel={() => setUploadConfirmed(false)}
            onConfirm={() => {
                syncToSupabase();
                setUploadConfirmed(false);
            }}
        />

        <LoggerPanel />
        </>
    );
}