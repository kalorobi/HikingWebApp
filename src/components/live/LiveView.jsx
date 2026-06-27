import { useEffect, useMemo, useRef, useState } from "react";
import { Tooltip } from 'react-tooltip';
import { supabase } from "../../services/SupabaseClient";
import { getVisitorId } from "../../services/Storage";
import "./LiveView.css"

export default function LiveView() {
  const [viewers, setViewers] = useState([]);
  const [now, setNow] = useState(Date.now());
  const me = useRef(0)

  // UI timer (csak kliens oldali render frissítés)
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const viewerId = getVisitorId();
    me.current = viewerId;

    const channel = supabase.channel("page-viewers");

    const updateViewers = () => {
      const state = channel.presenceState();

      const list = Object.values(state)
        .flat()
        .map((p) => ({
          viewerId: p.viewerId,
          joinedAt: p.joinedAt,
        }));

      setViewers(list);
    };

    channel
      .on("presence", { event: "sync" }, updateViewers)
      .on("presence", { event: "join" }, updateViewers)
      .on("presence", { event: "leave" }, updateViewers)
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            viewerId,
            joinedAt: Date.now(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function formatDuration(ms) {
    const sec = Math.floor(ms / 1000);
    const min = Math.floor(sec / 60);
    const rSec = sec % 60;

    return `${min}p ${rSec}s`;
  }

  return (
    <>
    <span data-tooltip-id="viewer-tooltip">{viewers.length} néző</span>

    <Tooltip id="viewer-tooltip" className="viewStat">
      <div>
        {viewers.map((v) => (
        <div key={v.viewerId}>
          {v.viewerId === me.current ? "Én->" : v.viewerId.slice(0, 6)} —{" "}
          {formatDuration(now - v.joinedAt)}
        </div>
        ))}
      </div>
    </Tooltip>
    </>
  );
}