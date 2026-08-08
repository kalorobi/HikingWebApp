import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../SupabaseClient';

// --- INSERT ---
export function useInsertLivePlanRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newRoute) => {
      // newRoute pl. { mountain: 'Mátra', name: '...', status: 'open', ... }
      const { data, error } = await supabase
        .from('live_plan_routes')
        .insert(newRoute)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['live-plan-routes', variables.mountain],
      });
      queryClient.invalidateQueries({
        queryKey: ["mountains", variables.user_id],
      });
    },
  });
}

// --- UPDATE ---
export function useUpdateLivePlanRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, user_id, mountain, ...updates }) => {
      // a mountain-t itt csak azért vesszük ki, hogy ne próbáljuk meg beírni a DB-be
      const { data, error } = await supabase
        .from('live_plan_routes')
        .update(updates)
        .eq('id', id)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['live-plan-routes', variables.mountain],
      });
      queryClient.invalidateQueries({
        queryKey: ["mountains", variables.user_id],
      });
    },
  });
}

/*
  const { data: routes, isLoading } = useLivePlanRoutes(mountain);
  const { mutate: insertRoute, isPending: isInserting } = useInsertLivePlanRoute();
  const handleCreate = () => {
    insertRoute({
      mountain,
      name: 'Új útvonal',
      status: 'open',
    });
  };
*/