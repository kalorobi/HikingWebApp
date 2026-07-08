import { supabase } from './SupabaseClient';

export async function checkUser(user, key){
  
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