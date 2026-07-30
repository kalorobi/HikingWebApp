import React, { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import LiveMap from '../components/live/LiveMap';
import LiveLogin from '../components/live/LiveLogin'
import { useLiveCoordinates } from '../services/supabase/LiveSupabase_3';
import { Icon } from '../assets/ikons/MapIcons';
import LiveFooter from '../components/live/LiveFooter'
import './Live.css';
import logger from '../utils/Logger';

const log = logger.scope("Live");

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
        if(geojson.features.length > 0) log.debug("Geojson is ready");
    },[geojson]);

    return (
        <div style={{ width: '100%', height: '100dvh', display: 'flex', flexDirection: 'column' }}>
            <div style={{flex: '1'}}>
                <LiveMap geojson={geojson} refress={refetchMissingPoints} auth={auth}/>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', height: '28px' }}>
                <LiveFooter geojson={geojson} auth={auth}/>
            </div>
            {!auth.is_ok && (<LiveLogin auth={auth} setAuth={setAuth} />)}
        </div>
    )
}