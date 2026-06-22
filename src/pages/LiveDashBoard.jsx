import { useEffect, useState } from "react";
import { supabase } from "../services/SupabaseClient";
import { LIVE_PRESENCE_CHANNEL } from "../services/VisitorsLog";
import "./LiveDashBoard.css";

function timeAgo(isoString) {
    const diff = Math.floor((Date.now() - Date.parse(isoString)) / 1000);

    if (diff < 60) return `${diff} mp`;

    const minutes = Math.floor(diff / 60);
    if (minutes < 60) return `${minutes} p`;

    const hours = Math.floor(minutes / 60);
    return `${hours} ó ${minutes % 60} p`;
}

export default function LiveDashboard() {
    const [viewers, setViewers] = useState([]);

    useEffect(() => {
        const channel = supabase.channel(LIVE_PRESENCE_CHANNEL);

        channel
            .on("presence", { event: "sync" }, () => {
                const state = channel.presenceState();

                // 1. összes presence egy listába
                const all = Object.values(state).flat();

                // 2. csak valós user presence (service kizárva)
                const viewers = all.filter(v => v.path && v.joined_at);

                // 3. rendezés (legfrissebb elöl)
                viewers.sort(
                    (a, b) =>
                        new Date(b.joined_at).getTime() -
                        new Date(a.joined_at).getTime()
                );

                setViewers(viewers);
            })
            .subscribe();

        // UI idő frissítés
        const timer = setInterval(() => {
            setViewers(prev => [...prev]);
        }, 1000);

        return () => {
            clearInterval(timer);
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <div className="live-dashboard">
            <div className="live-dashboard__header">
                <span className="live-dashboard__dot" />
                <span className="live-dashboard__count">
                    {viewers.length}
                </span>
                <span className="live-dashboard__label">
                    {viewers.length === 1 ? " néző" : " néző"}
                </span>
            </div>

            {viewers.length > 0 && (
                <ul className="live-dashboard__list">
                    {viewers.map((viewer, i) => (
                        <li
                            key={`${viewer.path}-${viewer.joined_at}-${i}`}
                            className="live-dashboard__item"
                        >
                            <span className="live-dashboard__path">
                                {viewer.path}
                            </span>

                            <span className="live-dashboard__since">
                                {timeAgo(viewer.joined_at)} óta
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}