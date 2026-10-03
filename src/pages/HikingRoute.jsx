import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import './styles/HikingRoute.css';
import { useGeojson } from '../components/hikingRoute/useGeojson';
import { resolveMountain } from '../utils/mountains';
import { useSelectedWays } from '../components/hikingRoute/useSelectedWays';
import HikingRouteMap from '../components/hikingRoute/HikingRouteMap';
import HikingRouteTable from '../components/hikingRoute/HikingRouteTable';
import { gpxToGeoJSON } from '../utils/gpxToGeojson';
import { Tooltip } from 'react-tooltip';
import { Icon } from '../assets/ikons/MapIcons';
import ConfirmDialog from '../components/common/ConfirmDialog';
import GpxDialog from '../components/hikingRoute/GpxDialog';
import { downloadGpx } from '../services/supabase/storageGpx';
import LoadingOverlay from '../components/common/LoadingOverlay';

export default function HikingRoute(){
    // /hikingRoute/:mountain - ez határozza meg, melyik hegység adataival dolgozunk
    const { mountain: mountainParam } = useParams();
    const mountain = resolveMountain(mountainParam ?? "Matra");

    //Térképen kijelölt szakasz
    const [selectedFeatureId, setSelectedFeatureId] = useState(null);
    //Táblázatban kijelölt szakaszok
    const [selectedWaysView, setSelectedWaysView] = useState(null);

    const [confirmState, setConfirmState] = useState(null); 
    const askConfirm = (title, text, onConfirm, cancel) => {
        setConfirmState({ title, text, onConfirm, cancel });
    };

    //Supabase storage-ből letöltött geojson (az adott hegységé)
    const { geojson, loading, error, setVisited, cutWay, undoLastEdit,
        syncToSupabase, pendingEditsCount, forceRefresh, addGpx } = useGeojson(mountain?.id ?? null);

    const usedGpxNames = geojson?.metadata?.gpxes?.map(g => g.name) ?? [];
    const [gpxDialogOpen, setGpxDialogOpen] = useState(false);
    const [gpxGeojson, setGpxGeojson] = useState(null);
    const [gpxTime, setGpxTime] = useState(null);

    //Térképen kijelölt szakasz kibővítve a következő elágazásig!
    const { selectedWays, selectedRelations } = useSelectedWays(geojson, selectedFeatureId);

    const fileInputRef = useRef(null);

    // hegységváltáskor a helyi (nem a hook-ban tárolt) kijelölések, betöltött gpx
    // nem maradhatnak - azok az előző hegység feature-eire mutatnának.
    // (Ha a route-ban `key={mountainParam}`-ot adsz a komponensnek, ez a effekt
    // feleslegessé válik, mert teljes remount történik.)
    useEffect(() => {
        setSelectedFeatureId(null);
        setSelectedWaysView(null);
        setGpxGeojson(null);
        setGpxTime(null);
        setConfirmState(null);
        setGpxDialogOpen(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, [mountainParam]);

    const handleGpxDialogSelect = async (fileName) => {
        setGpxDialogOpen(false);

        const gpx = await downloadGpx(fileName);
        
        const g = gpxToGeoJSON(gpx);
        g.features[0].properties.name = fileName;

        setGpxGeojson(g);

        const gpxDate = new Date(
            2000 + Number(fileName.slice(0, 2)),
            Number(fileName.slice(2, 4)) - 1,
            Number(fileName.slice(4, 6))
        );

        setGpxTime(gpxDate);
    };

    const handleGpxOk = () => {
        const gpxName = gpxGeojson.features[0]?.properties.name ?? null;
        if(!gpxName) return;
        addGpx(gpxName);
        handleClearGpx();
    }

    const handleClearGpx = () => {
        setGpxGeojson(null);
        setGpxTime(new Date());

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

    return(
        <>
        <div className='hikingBox'>
            <div className='hikingHeader'>
              Hiking Route v1.1 - {mountain.label}
            </div>
            <div className='mainBox'>
                <div className='mapBox'>
                    <HikingRouteMap 
                        mountain={mountain}
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
                        <Icon name='route' scale={0.8} onClick={() => setGpxDialogOpen(true)}
                            color='#F2E7D5'
                            data-tooltip-id="hiking-tooltip"
                            data-tooltip-content="GPX betöltés"
                        />
                        <Icon name='route_ok' scale={0.8}
                            onClick={() => 
                                gpxGeojson?
                                    askConfirm(
                                        'GPX rögzítés',
                                        `GPX feldolgozás megtörtént?
                                        ${gpxGeojson.features[0]?.properties.name ?? null}`,
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
                                    `A helyi adatbázisban ${pendingEditsCount} módosítás van (${mountain.label}).
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
                                    `${mountain.label} adatainak feltöltése az adatbázisba?
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
                        gpxTime={gpxTime}
                        setSelectedWaysView={setSelectedWaysView}
                        onSetVisited={handleConfirmVisited}
                    />
                    </div>
                </div>
            </div>
            <div className='hikingFooter'>
                <span>Letöltött geojson: {geojson?.metadata?.created_at?.slice(0, 10) ?? '-'}</span> 
                <span>Betöltött gpx: {gpxGeojson?.features[0]?.properties.name ?? '-'}</span>
                <Icon name='info' scale={0.8}
                    onClick={() => 
                        askConfirm(
                            'Információk',
                            `Hegység: ${mountain.label}
                            Utolsó gpx: ${geojson?.metadata?.gpxes?.at(-1)?.name ?? '-'}
                            Geojson alap: ${geojson?.metadata?.created_at ?? '-'}`,
                            handleCloseConfirm,
                        )
                    }
                    color='#F2E7D5'
                    style={{marginLeft: 'auto'}}
                />
            </div>
        </div>

        <LoadingOverlay open={loading} />

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

        <ConfirmDialog
            open={!!error}
            cancel={false}
            title="Hiba"
            text={error?.message ?? ''}
            onConfirm={() => {}}
        />

        <GpxDialog
            open={gpxDialogOpen}
            onCancel={() => setGpxDialogOpen(false)}
            onSelect={handleGpxDialogSelect}
            usedFiles={usedGpxNames}
        />
        </>
    );
}