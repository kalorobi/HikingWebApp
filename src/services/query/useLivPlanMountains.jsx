import { useQuery } from "@tanstack/react-query";
import { supabase } from "../SupabaseClient";

export function useLivePlanMountains(user_id) {
    return useQuery({
        queryKey: ["mountains", user_id],

        queryFn: async () => {
            const { data, error } = await supabase.rpc(
                "mountain_summary",
                {
                    p_user_id: user_id,
                }
            );

            if (error) {
                throw error;
            }

            return data;
        },

        enabled: !!user_id,
    });
}