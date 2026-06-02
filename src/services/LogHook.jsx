import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Log } from "./Log";

export default function LogHook() {
    const location = useLocation();

    useEffect(() => {
    Log();
    }, [location.pathname]);

    useEffect(() => {
        const timer = setTimeout(() => {
            const loaded = typeof window.umami !== "undefined";

            if (!loaded) {
                console.log("Analytics blocked");
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    return null;
}