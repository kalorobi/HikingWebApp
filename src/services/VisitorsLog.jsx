import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from './SupabaseClient';
import { getSessionId, getVisitorId } from "./indexedDb/Storage";
import logger from '../utils/Logger';

const log = logger.scope('VisitorLog');


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

    let visitorId = getVisitorId();
    let sessionId = getSessionId();

    useEffect(() => {

        async function callFunction() {
        const { data, error } = await supabase.functions.invoke(
            'matra_visitors',
            {
                body: {
                    path: location.pathname + window.location.search,
                    referrer: document.referrer || null,
                    language: navigator.language,
                    visitor_id: visitorId,
                    session_id: sessionId,
                    device_type: getDeviceType(),
                }
            }
        );
        if (error) log.error('database', error);
    }
    callFunction();

},[location.pathname, location.search])
}
