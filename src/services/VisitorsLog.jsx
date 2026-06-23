import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from './SupabaseClient';

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
