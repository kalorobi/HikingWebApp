import { supabase } from './SupabaseClient';

export async function checkUser(user){
    const { data, error } = await supabase
      .from('live_users')
      .select('id, user, is_active')
      .eq('user', user)
      .single();

    if (error || !data) return false;
    return data;
}