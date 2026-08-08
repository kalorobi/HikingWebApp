import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../SupabaseClient";
import { useAuth } from "../../auth/AuthContext";

// A bejelentkezett Supabase Auth felhasználóhoz (UUID) tartozó live_users
// numerikus user_id-ját kéri le a 'current_live_user_id' RPC-n keresztül.
// Ez váltja ki a korábban beégetett user_id=2 értéket - onnantól mindenki
// automatikusan a SAJÁT adatait látja, nem egy fixen beírt teszt-userét.
export function useCurrentLiveUserId() {
  const { user, loading: authLoading } = useAuth();

  const query = useQuery({
    queryKey: ["current_live_user_id", user?.id],

    queryFn: async () => {
      const { data, error } = await supabase.rpc("current_live_user_id");
      if (error) throw error;
      return data ?? null;
    },

    // csak akkor fusson, ha az auth állapot már eldőlt és van bejelentkezett user
    enabled: !authLoading && !!user,
  });

  return {
    ...query,
    // az auth betöltése is beleszámít a "még töltünk" állapotba
    isLoading: authLoading || query.isLoading,
  };
}