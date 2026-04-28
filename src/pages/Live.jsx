import React, { useEffect, useRef, useReducer, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import LiveMap from './LiveMap';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { geojsonSupabase, subscribeSupabase } from './LiveSupabase'; 

const initialState = {
  geojson: {type: "FeatureCollection",features: []},
  loading: true,
  error: null
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
  const [searchParams] = useSearchParams();
  const key = searchParams.get('key');
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    let channel;
    async function load() {
      try {
        const geojson = await geojsonSupabase(user);
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

  }, []);

  if (state.loading) return <p>Loading...</p>;
  if (state.error) return <p>Error: {state.error}</p>;

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <LiveMap geojson={state.geojson} />
    </div>
  );

};

export default Live;