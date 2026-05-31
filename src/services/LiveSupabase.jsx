import React, { useEffect, useRef, useReducer, useState } from 'react';
import { supabase } from './SupabaseClient';

export async function geojsonSupabase(user) {

  if(!user) {return {type: "FeatureCollection",features : []}}
  
  const today = new Date(); today.setHours(0, 0, 0, 0);
  
  const { data, error} = await supabase
  .from('coordinates')
  .select('lat, lng, mode')
  .eq('user', user)
  .gte('time', today.toISOString())
  .order('time', { ascending: true }); 

  if (error) {
    console.error(error);
    throw error;
  }

  if(data.length === 0){
    return {
      type: "FeatureCollection",
      features : []
    }
  }

  return {
    type: "FeatureCollection",
    features: data.map(row => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [row.lng, row.lat]
      },
      properties: {
        mode: row.mode || null,
        gsm: row.gsm || null,
        battery: row.battery || null
      }
    }))
  };
}

// Supabase realtime feliratkozas
// A Lucus altal kuldott adat realtime
export function subscribeSupabase(dispatch) {
  const channel = supabase
    .channel("coordinates-realtime")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "coordinates"
      },
      payload => {
        dispatch({
          type: "ADD_POINT",
          payload: { type: "Feature", geometry: {type: "Point",
            coordinates: [payload.new.lng, payload.new.lat]},
            properties: {}}
        });
      }
    ).subscribe(status => {
      dispatch({
        type: "SET_SUBSCRIBE_STATUS",
        payload : status
      });
    });

    return channel;
}

export async function planSupabase(user_id) {
  if(!user_id) {return {type: "FeatureCollection",features : []}}

  const { data, error} = await supabase
  .from('live_plan_routes')
  .select('plan_name, description, link, mountain, geojson')
  .eq('user_id', user_id)
  .eq('is_active', true)
  .eq('is_ready', true)
  .order('created_at', { ascending: false }); 

  if (error) {
    console.error(error);
    throw error;
  }

  return data[0].geojson;

}