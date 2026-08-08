import { supabase } from '../SupabaseClient';
import logger from '../../utils/Logger';
 
const log = logger.scope('fetchPlannedRoutes');
 
export async function fetchPlannedRoutes(user_id) {
  const { data, error } = await supabase
    .from('live_plan_routes')
    .select('plan_name, description, link, mountain, geojson')
    .eq('user_id', user_id)
    .eq('is_active', true)
    .eq('is_ready', true)
    .order('created_at', { ascending: false });
 
  if (error) {
    log.error('Plan route', error);
    throw error;
  }
 
  log.debug('Plan route fetch is ok');
  return data ?? [];
}