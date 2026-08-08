import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../SupabaseClient';
import { fetchTodayLivePoints } from '../../supabase/fetchTodayLivePoints';
import logger from '../../../utils/Logger';

const log = logger.scope('useLiveTrackingPoints');
const EMPTY_POINTS = [];

// napi granularitású cache-kulcs rész - ha valaki éjfélen át nyitva hagyja
// az appot, ez természetes módon egy ÚJ query-t (és üres kezdőállapotot)
// eredményez a következő napra, ahelyett hogy a tegnapi cache-ben ragadna
function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

// A mai nap élő koordinátáit tölti le, ÉS feliratkozik a Realtime-ra az újakért.
// A mobilon való visszaváltáskor/net-visszatéréskor való automatikus frissítést
// a LiveQueryClient refetchOnWindowFocus/refetchOnReconnect beállítása adja -
// nincs szükség kézzel írt visibilitychange/pageshow listenerre.
export function useLiveTrackingPoints(user_id) {
  const queryClient = useQueryClient();
  const enabled = user_id != null && user_id >= 0;
  const queryKey = ['livePoints', user_id, todayDateString()];

  const query = useQuery({
    queryKey,
    queryFn: () => fetchTodayLivePoints(user_id),
    enabled,
  });

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel(`live_coordinates_user_${user_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_coordinates',
          filter: `user_id=eq.${user_id}`,
        },
        (payload) => {
          const row = payload.new;

          // dedupe a cache-ben lévő adat ALAPJÁN (nem egy külön ref/Set-tel) -
          // ha ez a pont már benne van (pl. mert időközben egy refetch már
          // behozta), nem adjuk hozzá újra
          queryClient.setQueryData(queryKey, (old = []) => {
            if (row.created_at && old.some((p) => p.created_at === row.created_at)) {
              return old;
            }
            return [...old, row];
          });
        }
      )
      .subscribe();

    log.debug('Supabase live subscribe');
    return () => { supabase.removeChannel(channel); };
    // a queryKey tartalma (todayDateString) csak naponta egyszer változik,
    // a user_id/enabled a valódi függőség itt
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, user_id]);

  return {
    points: query.data ?? EMPTY_POINTS,
    isLoading: query.isLoading,
    isRefetching: query.isFetching && !query.isLoading,
    refetch: query.refetch,
  };
}
