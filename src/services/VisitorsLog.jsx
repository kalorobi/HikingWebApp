import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from './SupabaseClient';
import { getSessionId, getVisitorId } from "./indexedDb/Storage";


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
export function visitorTrack(event="pageview"){

}
export default function VisitorsLog() {
    const location = useLocation();
    const called = useRef(false);

    let visitorId = getVisitorId();
    let sessionId = getSessionId();

    useEffect(() => {
        if (called.current) return;
        called.current = true;

        async function callFunction() {
        const { data, error } = await supabase.functions.invoke(
            'matra_visitors',
            {
                body: {
                    path: location.pathname,
                    referrer: document.referrer || null,
                    language: navigator.language,
                    visitor_id: visitorId,
                    session_id: sessionId,
                    device_type: getDeviceType(),
                }
            }
        );
        if (error) {console.log(error);return;}
    }
    callFunction();

},[location.pathname])
}
