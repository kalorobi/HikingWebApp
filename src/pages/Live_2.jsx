import React, { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import LiveMap_2 from '../components/map/LiveMap_2';
import Login from '../components/login/Login'
import { useLiveCoordinates } from '../services/LiveSupabese_2';

import testgeojson from '../components/map/testgeo.json'

export default function Live_2(){

    const { user } = useParams();
    const [searchParams] = useSearchParams();
    const urlKey = searchParams.get('key');
    const [auth, setAuth] = useState({
        user: user ?? null,
        key: urlKey ?? null,
        user_id: -1,
        is_ok: false
    });
    const { geojson } = useLiveCoordinates(auth.user_id);

    useEffect(() => {
        console.log(geojson)
    },[geojson])

    return (
        <div style={{ width: '100%', height: '100vh' }}>
            <LiveMap_2 geojson={geojson} auth={auth}/>
            {!auth.is_ok && (<Login auth={auth} setAuth={setAuth} />)}
        </div>
    )
}