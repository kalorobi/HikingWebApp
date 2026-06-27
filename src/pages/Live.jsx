import React, { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import LiveMap from '../components/live/LiveMap';
import Login from '../components/login/Login'
import { useLiveCoordinates } from '../services/LiveSupabase';
import { Icon } from '../assets/ikons/MapIcons';
import LiveFooter from '../components/live/LiveFooter'
import './Live.css';

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

    useEffect(() => {
        const stored = sessionStorage.getItem("session_auth");

        if (stored) {
            setAuth(JSON.parse(stored));
        }
    }, []);

    return (
        <div style={{ width: '100%', height: '100dvh', display: 'flex', flexDirection: 'column' }}>
            <div style={{flex: '1'}}>
                <LiveMap geojson={geojson} refress={refetchMissingPoints} auth={auth}/>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', height: '32px' }}>
                <LiveFooter />
            </div>
            {!auth.is_ok && (<Login auth={auth} setAuth={setAuth} />)}
        </div>
    )
}