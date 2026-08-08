import { supabase } from '../SupabaseClient';
import logger from '../../utils/Logger';

const log = logger.scope('fetchTodayLivePoints');

export async function fetchTodayLivePoints(user_id) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('live_coordinates')
    .select('*')
    .eq('user_id', user_id)
    .gte('created_at', today.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    log.error('Live point today', error);
    throw error;
  }

  log.debug('Live point today fetch is ok');
  return data ?? [];
}