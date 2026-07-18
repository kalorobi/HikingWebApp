import { supabase } from "../SupabaseClient";

export async function MountainSummary(user_id){
    const { data, error } = await supabase.rpc(
        "mountain_summary",
        {
            p_user_id: user_id,
        }
    );

    if(error) return null;
    
    return data;
}