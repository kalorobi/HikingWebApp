import React, { useEffect, useRef, useReducer, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import LiveMap from '../components/LiveMap';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { geojsonSupabase, subscribeSupabase } from '../services/LiveSupabase'; 
import Login from '../components/Login'
import { LiveStatus } from '../components/StatusDisplay';

const initialState = {
  geojson: {type: "FeatureCollection",features: []},
  error: null,
  realTimeStatus: "CONNECTING"
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_DATA":
      return {
        ...state,
        geojson: action.payload,
      };

    case "ADD_POINT": {
      let features;
      features = [...state.geojson.features, action.payload];
      return {
        ...state,geojson: {...state.geojson,features}
      }
    };

    case "SET_SUBSCRIBE_STATUS": {
      return {...state, realTimeStatus: action.payload}
    }

    case "ERROR": return {...state,
        error: action.payload,
      };

    default:
      return state;
  }
}

const Live = () => {
  const { user } = useParams();
  const liveKey = import.meta.env.VITE_LIVE_KEY;
  const [searchParams] = useSearchParams();
  const key = searchParams.get('key');
  const [auth, setAuth] = useState({
    user: user || '',
    key: key || '',
    isOk: !!(user && key) && (key === liveKey)
  });
  const [state, dispatch] = useReducer(reducer, initialState);
  const liveChannel = useRef(null);

  useEffect(() => {
    if ((user && key) && (key === liveKey)) {
      setAuth({ user: user, key: key, isOk: true });
    }
  }, [user, key]);


  useEffect(() => {
     if (!auth.isOk) return;

    async function load() {
      try {
        const geojson = await geojsonSupabase(auth.user);
        dispatch({ type: "SET_DATA", payload: geojson });
      } catch (err) {
        dispatch({ type: "ERROR", payload: err.message });
      }

      if(!liveChannel.current) liveChannel.current = subscribeSupabase(dispatch);
    }

    load();

    return () => {
      if (liveChannel.current) {
        liveChannel.current.unsubscribe();
        liveChannel.current = null;
      }
    };

  }, [auth.isOk]);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      {!auth.isOk && (<Login currentAuth={auth} setAuth={setAuth} />)}
      <LiveStatus status={state.realTimeStatus} />
      <LiveMap geojson={state.geojson} />
    </div>
  );

};

export default Live;