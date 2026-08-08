import { useQuery } from '@tanstack/react-query';
import { fetchPlannedRoutes } from '../../supabase/fetchPlannedRoutes';

const EMPTY_POINTS = [];
 
export function useLivePlannedRoutes(user_id) {
  const enabled = user_id != null && user_id >= 0;
 
  const query = useQuery({
    queryKey: ['plannedRoutes', user_id],
    queryFn: () => fetchPlannedRoutes(user_id),
    enabled,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
 
  return {
    plannedRoutes: query.data ?? EMPTY_POINTS,
    isLoading: query.isLoading,
    error: query.error,
  };
}