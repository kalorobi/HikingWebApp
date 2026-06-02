export function Log(){

    let visitorId = localStorage.getItem("visitor_id");
    if (!visitorId) {
        visitorId = crypto.randomUUID();
        localStorage.setItem("visitor_id", visitorId);
    }
    let sessionId = sessionStorage.getItem("session_id");
    if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem("session_id", sessionId);
    }

    const payload = {
        visitorId,
        sessionId,
        page: window.location.pathname,
        referrer: document.referrer || null,
        timestamp: new Date().toISOString(),
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        language: navigator.language,
  };

  console.log(JSON.stringify(payload))
}