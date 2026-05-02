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
  loading: true,
  error: null,
  realTimeStatus: "CONNECTING"
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_DATA":
      return {
        ...state,
        geojson: action.payload,
        loading: false
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
        loading: false
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

  useEffect(() => {
    if ((user && key) && (key === liveKey)) {
      setAuth({ user: user, key: key, isOk: true });
    }
  }, [user, key]);


  useEffect(() => {
     if (!auth.isOk) return;

    let channel;
    async function load() {
      try {
        const geojson = await geojsonSupabase(auth.user);
        dispatch({ type: "SET_DATA", payload: geojson });
      } catch (err) {
        dispatch({ type: "ERROR", payload: err.message });
      }

      channel = subscribeSupabase(dispatch);
    }

    load();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };

  }, [auth.isOk]);

  useEffect (() => {
    console.log("Realtime: " + state.realTimeStatus);
  }, [state.realTimeStatus])

  //if (state.loading) return <p>Loading...</p>;
  //if (state.error) return <p>Error: {state.error}</p>;

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      {!auth.isOk && (<Login currentAuth={auth} setAuth={setAuth} />)}
      <LiveStatus status={state.realTimeStatus} />
      <LiveMap geojson={state.geojson} />
    </div>
  );

};

export default Live;