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

export default function HikingRoute(){
    //Térképen kijelölt szakasz
    const [selectedFeatureId, setSelectedFeatureId] = useState(null);
    //Táblázatban kijelölt szakaszok
    const [selectedWaysView, setSelectedWaysView] = useState(null);

    const [confirmState, setConfirmState] = useState(null); 
    const askConfirm = (title, text, onConfirm, cancel) => {
        setConfirmState({ title, text, onConfirm, cancel });
    };

    //Supabase storage-ből letöltött geojson
    const { geojson, loading, setVisited, cutWay, undoLastEdit,
        syncToSupabase, pendingEditsCount, forceRefresh, addGpx } = useGeojson();

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

    const handleGpxOk = () => {
        const gpxName = gpxGeojson.features[0]?.properties.name ?? null;
        if(!gpxName) return;
        addGpx(gpxName);
    }

    const handleClearGpx = () => {
        setGpxGeojson(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleCloseConfirm = () => {
        setConfirmState(null);
    }

    const handleFeatureClick = (featureId) =>{
        setSelectedFeatureId(featureId);
    }

    // a térkép "cut-point" rétegén történő kattintásból érkezik: featureId = a vágandó way
    // valódi (OSM eredetű) feature.id-je, pointIndex = a way koordináta-tömbjének indexe,
    // ahol a vágás történjen
    const handleCutPoint = useCallback((featureId, pointIndex) => {
        cutWay(featureId, pointIndex);
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
            <div className='hikingHeader'>
              Hiking Route v1.0
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
                         <Icon name='undo' scale={0.8}
                            onClick={
                                pendingEditsCount > 0 ?
                                undoLastEdit : undefined
                            }
                            color={pendingEditsCount > 0 ?  '#F2E7D5' : '#C9A78E'}
                            data-tooltip-id="hiking-tooltip"
                            data-tooltip-content="Visszavonás"
                        />
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
                        <Icon name='route_ok' scale={0.8}
                            onClick={() => 
                                gpxGeojson?
                                    askConfirm(
                                        'GPX rögzítés',
                                        `GPX feldolgozás megtörtént?`,
                                        handleGpxOk
                                )
                                : undefined
                            }
                            color={gpxGeojson?  '#F2E7D5' : '#C9A78E'}
                            data-tooltip-id="hiking-tooltip"
                            data-tooltip-content="GPX hozzáadás"
                        />
                        <Icon name='route_off' scale={0.8} 
                            onClick={
                                gpxGeojson?
                                    handleClearGpx
                                    : undefined
                            }
                            color={gpxGeojson?  '#F2E7D5' : '#C9A78E'}
                            data-tooltip-id="hiking-tooltip"
                            data-tooltip-content="GPX törlés"
                        />
                        <Icon name='database_del' scale={0.8}
                            onClick={() =>
                                pendingEditsCount > 0 ?
                                askConfirm(
                                    'Törlés',
                                    `A helyi adatbázisban ${pendingEditsCount} módosítás van.
                                    Biztosan folytatod?`,
                                    forceRefresh
                                )
                                : undefined
                            }
                            color={pendingEditsCount > 0 ?  '#F2E7D5' : '#C9A78E'}
                            data-tooltip-id="hiking-tooltip"
                            data-tooltip-content="Helyi adatbázis törlés"
                        />
                        <Icon name='upload' scale={0.8}
                            onClick={() => 
                                pendingEditsCount > 0 ?
                                askConfirm(
                                    'Feltöltés',
                                    `Adatok feltöltése az adatbázisba?
                                    A helyi adatbázisban ${pendingEditsCount} módosítás van.`,
                                    syncToSupabase
                                ) 
                                : undefined 
                            }
                            color={pendingEditsCount > 0 ?  '#F2E7D5' : '#C9A78E'}
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
            <div className='hikingFooter'>
                <span>Letöltött geojson: {geojson.metadata.created_at.slice(0, 10)}</span> 
                <span>Betöltött gpx: {gpxGeojson?.features[0]?.properties.name ?? '-'}</span>
                <Icon name='info' scale={0.8}
                    onClick={() => 
                        askConfirm(
                            'Információk',
                            `Utolsó gpx: ${geojson.metadata.gpxes[geojson.metadata.gpxes.length-1].name}
                            Geojson alap: ${geojson.metadata.base}`,
                            handleCloseConfirm,
                        )
                    }
                    color='#F2E7D5'
                    style={{marginLeft: 'auto'}}
                />
            </div>
        </div>

        <ConfirmDialog
            open={!!confirmState}
            cancel={confirmState?.cancel ?? true}
            title={confirmState?.title}
            text={confirmState?.text}
            onCancel={() => setConfirmState(null)}
            onConfirm={() => {
                confirmState?.onConfirm();
                setConfirmState(null);
            }}
        />
        </>
    );
}