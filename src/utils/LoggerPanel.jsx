import { useEffect, useState } from "react";
import logger from "./Logger";

const LEVEL_COLORS = {
  DEBUG: "#9CA3AF",
  INFO: "#60A5FA",
  WARN: "#FBBF24",
  ERROR: "#F87171",
};

const LEVEL_ORDER = ["DEBUG", "INFO", "WARN", "ERROR"];

/**
 * Lebegő debug panel a logger által gyűjtött logok megtekintéséhez
 * és exportálásához. Csak fejlesztői módban (import.meta.env.DEV) renderel.
 *
 * Használat: tedd be egyszer, az App gyökerében.
 *   <LoggerPanel />
 */
export default function LoggerPanel() {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState(() => logger.getLogs());
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [scopeFilter, setScopeFilter] = useState("ALL");

  useEffect(() => {
    return logger.subscribe(() => setLogs(logger.getLogs()));
  }, []);

  if (!import.meta.env.DEV) return null;

  const scopes = Array.from(new Set(logs.map((l) => l.scope).filter(Boolean))).sort();

  const filtered = logs
    .filter((l) => levelFilter === "ALL" || l.levelName === levelFilter)
    .filter((l) => scopeFilter === "ALL" || l.scope === scopeFilter)
    .slice()
    .reverse();

  return (
    <div style={styles.root}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={styles.toggle}
        title="Debug logok"
      >
        {open ? "✕" : `▤ ${logs.length}`}
      </button>

      {open && (
        <div style={styles.panel}>
          <div style={styles.toolbar}>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              style={styles.select}
            >
              <option value="ALL">Minden szint</option>
              {LEVEL_ORDER.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>

            {scopes.length > 0 && (
              <select
                value={scopeFilter}
                onChange={(e) => setScopeFilter(e.target.value)}
                style={styles.select}
              >
                <option value="ALL">Minden scope</option>
                {scopes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}

            <div style={styles.spacer} />

            <button style={styles.btn} onClick={() => logger.exportLogs("json")}>
              Export JSON
            </button>
            <button style={styles.btn} onClick={() => logger.exportLogs("text")}>
              Export TXT
            </button>
            <button style={styles.btnDanger} onClick={() => logger.clearLogs()}>
              Törlés
            </button>
          </div>

          <div style={styles.list}>
            {filtered.length === 0 && (
              <div style={styles.empty}>Nincs megjeleníthető log.</div>
            )}
            {filtered.map((r, i) => (
              <div
                key={i}
                style={{
                  ...styles.row,
                  borderLeftColor: LEVEL_COLORS[r.levelName] ?? "#6B7280",
                }}
              >
                <span style={styles.time}>
                  {r.timestamp.toLocaleTimeString("hu-HU", { hour12: false })}
                </span>
                <span style={{ ...styles.level, color: LEVEL_COLORS[r.levelName] }}>
                  {r.levelName}
                </span>
                {r.scope && <span style={styles.scope}>[{r.scope}]</span>}
                <span style={styles.message}>{String(r.message)}</span>
                {r.args.length > 0 && (
                  <span style={styles.args}>
                    {r.args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ")}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const FONT = '"SF Mono", "Fira Code", Consolas, monospace';

const styles = {
  root: {
    position: "fixed",
    bottom: 16,
    right: 16,
    zIndex: 999999,
    fontFamily: FONT,
    fontSize: 12,
  },
  toggle: {
    background: "#111827",
    color: "#E5E7EB",
    border: "1px solid #374151",
    borderRadius: 6,
    padding: "6px 10px",
    cursor: "pointer",
    fontFamily: FONT,
    fontSize: 12,
    boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
  },
  panel: {
    position: "absolute",
    bottom: 40,
    right: 0,
    width: 560,
    maxHeight: 420,
    background: "#0B0F19",
    border: "1px solid #374151",
    borderRadius: 8,
    boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 10px",
    borderBottom: "1px solid #1F2937",
    background: "#111827",
  },
  select: {
    background: "#1F2937",
    color: "#E5E7EB",
    border: "1px solid #374151",
    borderRadius: 4,
    padding: "3px 6px",
    fontFamily: FONT,
    fontSize: 11,
  },
  spacer: { flex: 1 },
  btn: {
    background: "#1F2937",
    color: "#E5E7EB",
    border: "1px solid #374151",
    borderRadius: 4,
    padding: "3px 8px",
    cursor: "pointer",
    fontFamily: FONT,
    fontSize: 11,
  },
  btnDanger: {
    background: "#7F1D1D",
    color: "#FCA5A5",
    border: "1px solid #991B1B",
    borderRadius: 4,
    padding: "3px 8px",
    cursor: "pointer",
    fontFamily: FONT,
    fontSize: 11,
  },
  list: {
    overflowY: "auto",
    padding: 4,
  },
  empty: {
    padding: 16,
    textAlign: "center",
    color: "#6B7280",
  },
  row: {
    display: "flex",
    alignItems: "baseline",
    gap: 8,
    padding: "4px 8px",
    borderLeft: "3px solid transparent",
    borderBottom: "1px solid #111827",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  time: { color: "#6B7280", flexShrink: 0 },
  level: { fontWeight: 700, flexShrink: 0, width: 42 },
  scope: { color: "#93C5FD", flexShrink: 0 },
  message: { color: "#E5E7EB", overflow: "hidden", textOverflow: "ellipsis" },
  args: { color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis" },
};