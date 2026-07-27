import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../SupabaseClient';

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
import { useLivePlanRoutes } from '../hooks/useLivePlanRoutes';
import { useInsertLivePlanRoute, useUpdateLivePlanRoute } from '../hooks/useLivePlanRoutesMutations';

function RoutesPage({ mountain }) {
  const { data: routes, isLoading } = useLivePlanRoutes(mountain);
  const { mutate: insertRoute, isPending: isInserting } = useInsertLivePlanRoute();
  const { mutate: updateRoute, isPending: isUpdating } = useUpdateLivePlanRoute();

  const handleCreate = () => {
    insertRoute({
      mountain,
      name: 'Új útvonal',
      status: 'open',
    });
  };

  const handleUpdate = (route) => {
    updateRoute({
      id: route.id,
      mountain, // ez kell az invalidáláshoz, de nem kerül update-be
      status: 'closed',
    });
  };

  if (isLoading) return <div>Betöltés...</div>;

  return (
    <div>
      <button onClick={handleCreate} disabled={isInserting}>
        Új útvonal hozzáadása
      </button>

      {routes.map((route) => (
        <div key={route.id}>
          {route.name} — {route.status}
          <button onClick={() => handleUpdate(route)} disabled={isUpdating}>
            Lezárás
          </button>
        </div>
      ))}
    </div>
  );
}
*/