import React, { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import LiveMap from '../components/map/LiveMap';
import Login from '../components/login/Login'
import { useLiveCoordinates } from '../services/LiveSupabase_2';

export default function Live(){

    const { user } = useParams();
    const [searchParams] = useSearchParams();
    const urlKey = searchParams.get('key');
    const [auth, setAuth] = useState({
        user: user ?? null,
        key: urlKey ?? null,
        user_id: -1,
        is_ok: false
    });
    
    const { geojson, refetchMissingPoints, isRefetching } = useLiveCoordinates(auth.user_id);
    const [meta, setMeta] = useState({distance: 0, up: 0})

    useEffect(() => {
        const stored = sessionStorage.getItem("session_auth");

        if (stored) {
            setAuth(JSON.parse(stored));
            console.log("SET AUTH")
        }
    }, []);

    useEffect(() => {
        setMeta(prev => ({...prev,
            distance: geojson.features[2]?.properties?.summary?.distance ?? 0,
            up: calcUp(geojson.features[2]?.geometry?.coordinates),
        }))
    }, [geojson])

    function calcUp(coordinates){
        if(!coordinates) return 0;
        let up = 0;

        coordinates.forEach((coord, i, coords) => {
            if(i !== 0) {
                if(coords[i][2] > coords[i-1][2]){
                    up += coords[i][2] - coords[i-1][2];
                }
            }
        })
        return up;
    }

    return (
        <div style={{ width: '100%', height: '100dvh', display: 'flex', flexDirection: 'column' }}>
            <div style={{flex: '1'}}>
                <LiveMap geojson={geojson} refress={refetchMissingPoints} auth={auth}/>
            </div>
            <div className='footer'>
                <div>távolság: <b>{(meta.distance/1000).toFixed(2)}</b> km szint: {meta.up} m</div>
            </div>
            {!auth.is_ok && (<Login auth={auth} setAuth={setAuth} />)}
        </div>
    )
}