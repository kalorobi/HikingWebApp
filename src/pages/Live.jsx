import React, { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import LiveMap from '../components/map/LiveMap';
import Login from '../components/login/Login'
import { useLiveCoordinates } from '../services/LiveSupabase_2';

import testgeojson from '../components/map/testgeo.json'

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

    function getSessionAuth(){
        let session_auth = sessionStorage.getItem("session_auth");
        if(!session_auth) { return false }
        else { return true }
    }

    return (
        <div style={{ width: '100%', height: '100vh' }}>
            <LiveMap geojson={geojson} refress={refetchMissingPoints} auth={auth}/>
            {!auth.is_ok && (<Login auth={auth} setAuth={setAuth} />)}
        </div>
    )
}