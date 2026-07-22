import { supabase } from "../SupabaseClient";

export async function AllRoutes(userId) {
    const { data, error } = await supabase
      .from('live_plan_routes')
      .select('*')
      .eq('user_id', userId)
      .eq('is_ok', false);

      if(error) return null;

      return data;
}