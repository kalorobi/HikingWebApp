import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from './SupabaseClient';

export const LIVE_PRESENCE_CHANNEL = "live-viewers";

function getDeviceType() {
    const ua = navigator.userAgent || '';
    if (/ipad|tablet|playbook|silk/i.test(ua) && !/mobile/i.test(ua)) {
        return 'tablet';
    }
    if (/mobi|iphone|ipod|android.*mobile|windows phone/i.test(ua)) {
        return 'mobile';
    }
    return 'desktop';
}
 
// crypto.randomUUID() csak "secure context"-ben (HTTPS vagy localhost)
// érhető el -- fallback helyi hálózati IP-s teszteléshez.
function generateUUID() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
async function getGeoLocation() {
    try {
        const res = await fetch('https://ipapi.co/json/');
        if (!res.ok) return { country: null, city: null };
        const data = await res.json();
        return {
            country: data.country_name || null,
            city: data.city || null,
        };
    } catch {
        return { country: null, city: null };
    }
}
export default function VisitorsLog() {
    const location = useLocation();
    const lastTracked = useRef(null);
    const presenceChannelRef = useRef(null);
    const isLivePage = /^\/live\/?(?:[^/]+)?\/?$/.test(location.pathname);
 
    useEffect(() => {
        // Csak a React StrictMode dupla-futása ellen véd (ugyanarra a
        // pathname-re kétszer egymás után, UGYANAZON a mountoláson belül).
        // Teljes oldal-újratöltésnél (F5, URL beírás, böngésző-navigáció)
        // ez a ref is nullázódik egy friss komponens-példánnyal együtt --
        // tehát minden ilyen betöltés újra rögzíti a látogatást.
        if (lastTracked.current === location.pathname) return;
        lastTracked.current = location.pathname;
 
        const trackVisit = async () => {
            try {
                let visitorId = localStorage.getItem("visitor_id");
                if (!visitorId) {
                    visitorId = generateUUID();
                    localStorage.setItem("visitor_id", visitorId);
                }
                let sessionId = sessionStorage.getItem("session_id");
                if (!sessionId) {
                    sessionId = generateUUID();
                    sessionStorage.setItem("session_id", sessionId);
                }
                const { country, city } = await getGeoLocation();
                const { error } = await supabase.from('matra_visitors').insert({
                    path: location.pathname,
                    referrer: document.referrer || null,
                    language: navigator.language,
                    created_at: new Date().toISOString(),
                    visitor_id: visitorId,
                    session_id: sessionId,
                    country,
                    city,
                    device_type: getDeviceType(),
                });
 
                if (error) throw error;
            } catch (err) {
                console.error('Látogatás rögzítése sikertelen:', err);
                lastTracked.current = null; // hiba esetén engedjük újrapróbálni
            }
        };
 
        trackVisit();
    }, [location.pathname]);


    // --- Élő jelenlét: csak /live és /live/:user oldalakon ---
    useEffect(() => {

        if (!isLivePage) {
            if (presenceChannelRef.current) {
                supabase.removeChannel(presenceChannelRef.current);
                presenceChannelRef.current = null;
            }
            return;
        }

        //if (!isLivePage) return;
 
        let sessionId = sessionStorage.getItem("session_id");
        if (!sessionId) {
            sessionId = generateUUID();
            sessionStorage.setItem("session_id", sessionId);
        }
 
        const channel = supabase.channel(LIVE_PRESENCE_CHANNEL, {
            config: { presence: { key: sessionId } },
        });
 
        channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.track({
                    path: location.pathname,
                    joined_at: new Date().toISOString(),
                });
            }
        });
 
        presenceChannelRef.current = channel;
 
        return () => {
            supabase.removeChannel(channel);
            presenceChannelRef.current = null;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLivePage]);
 
    // /live-on belüli route-váltásnál frissíti a path-t a meglévő csatornán
    useEffect(() => {
        const channel = presenceChannelRef.current;
        if (!channel) return;

        const update = async () => {
            await channel.untrack();

            await channel.track({
                path: location.pathname,
                joined_at: new Date().toISOString(),
            });
        };

        update();
        /*
        if (presenceChannelRef.current) {
            presenceChannelRef.current.track({
                path: location.pathname,
                joined_at: new Date().toISOString(),
            });
        }
            */
    }, [location.pathname]);
 
    return null;
}