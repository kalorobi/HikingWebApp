import { supabase } from "../SupabaseClient";
import logger from '../../utils/Logger';
 
const log = logger.scope('fetchAllPlannedRoutes');

export async function fetchAllPlannedRoutes(userId) {
    const { data, error } = await supabase
      .from('live_plan_routes')
      .select('*')
      .eq('user_id', userId)
      .eq('is_ok', false);

      if (error) {
        log.error('All planned route', error);
        throw error;
    }
 
    log.debug('All planned route fetch is ok');
    return data ?? [];
}