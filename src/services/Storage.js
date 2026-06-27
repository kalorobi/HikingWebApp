export function getVisitorId(){
    let visitorId = localStorage.getItem("visitor_id");
    if (!visitorId) {
        visitorId = generateUUID();
        localStorage.setItem("visitor_id", visitorId);
    }
    return visitorId
}
export function getSessionId(){
    let sessionId = sessionStorage.getItem("session_id");
    if (!sessionId) {
        sessionId = generateUUID();
        sessionStorage.setItem("session_id", sessionId);
    }
    return sessionId
}

export function setSession({key, value}){
    sessionStorage.setItem(key, value);
}

export function generateUUID() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}