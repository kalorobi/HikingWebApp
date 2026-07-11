import { useEffect, useState } from "react";
import { supabase } from "./SupabaseClient";

export function getPlans(user_id) {
  const [planedRoutes, setPlanedRoutes] = useState(null);

  useEffect(() => {
    async function readPlans(user_id) {
      const { data, error } = await supabase
        .from('live_plan_routes')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });

        if(error) {setPlanedRoutes([])}
        setPlanedRoutes(data);
    }
    
    readPlans(user_id);

  },[user_id]);

  return {planedRoutes};
    
}