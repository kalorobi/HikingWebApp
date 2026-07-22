import { useQuery } from '@tanstack/react-query';
import { supabase } from '../SupabaseClient';

export function useLivePlanRoutes(mountain) {
  return useQuery({
    queryKey: ['live-plan-routes', mountain],

    queryFn: async () => {
      const { data, error } = await supabase
        .from('live_plan_routes')
        .select('*')
        .eq('mountain', mountain);

      if (error) {
        throw error;
      }

      return data;
    },

    enabled: !!mountain,
  });
}