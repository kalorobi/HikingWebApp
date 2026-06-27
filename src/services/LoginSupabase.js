import { supabase } from './SupabaseClient';

export async function checkUser(user, key){
  console.log(user, decodeURIComponent(key))
  const { data, error } = await supabase.rpc('check_user', {
    live_user: user,
    live_key: decodeURIComponent(key)
  });
  if(error) {
    console.log(error);
    return null;
  }

  return data;
}

/*export async function checkUser(user){
    const { data, error } = await supabase
      .from('live_users')
      .select('id, user, is_active')
      .eq('user', user)
      .single();

    if (error || !data) return false;
    return data;
  
}*/