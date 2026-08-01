/**
 * logger.js
 * Egyszerű, de bővíthető logger React (Vite) projektekhez.
 *
 * Alap használat:
 *   import logger from "./logger";
 *   logger.info("App elindult");
 *
 *   const log = logger.scope("Auth");
 *   log.debug("Token frissítve", token);
 *
 * Bővítés (pl. Sentry, remote endpoint):
 *   logger.addTransport((record) => {
 *     if (record.level >= LOG_LEVELS.ERROR) {
 *       Sentry.captureMessage(record.message, { extra: { args: record.args } });
 *     }
 *   });
 */

export const LOG_LEVELS = Object.freeze({
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 99,
});

const DEFAULT_LEVEL = import.meta.env.DEV ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN;

const LEVEL_META = {
  DEBUG: { value: LOG_LEVELS.DEBUG, method: "log", style: "color:#9CA3AF;font-weight:bold;" },
  INFO: { value: LOG_LEVELS.INFO, method: "info", style: "color:#2563EB;font-weight:bold;" },
  WARN: { value: LOG_LEVELS.WARN, method: "warn", style: "color:#D97706;font-weight:bold;" },
  ERROR: { value: LOG_LEVELS.ERROR, method: "error", style: "color:#DC2626;font-weight:bold;" },
};

/**
 * Konzol transport – ez a "default" viselkedés, amit az eredeti logger is csinált.
 * Egy transport egyszerűen egy függvény, ami megkapja a log rekordot.
 */
function consoleTransport(record) {
  const { levelName, scope, message, args, timestamp } = record;
  const meta = LEVEL_META[levelName];
  const time = timestamp.toLocaleTimeString("hu-HU", { hour12: false });
  const scopeLabel = scope ? ` [${scope}]` : "";

  console[meta.method](
    `%c${time} ${levelName}${scopeLabel}`,
    meta.style,
    message,
    ...args
  );
}

/**
 * Központi állapot, amit MINDEN Logger példány (root és scope-olt gyerekek egyaránt)
 * megoszt. Ez oldja meg azt a problémát, hogy setLevel() a scope-olt loggereken
 * is érvényesüljön, ne csak a root-on.
 */
function createSharedState(initialLevel, maxHistory) {
  return {
    level: initialLevel,
    transports: [consoleTransport],
    history: [],
    maxHistory,
    listeners: new Set(),
  };
}

function notify(shared) {
  // Ha render közben (pl. egy komponens törzsében) történik logolás, a listener-eket
  // NEM szabad szinkron hívni, mert az egy másik komponens state-jét módosítaná
  // renderelés közben ("Cannot update a component while rendering a different
  // component"). Ezért a microtask sorra halasztjuk, és a render/commit lezárása
  // után egyszerre értesítünk – ez egyúttal több gyors logot is összevon egy
  // UI frissítésbe.
  if (shared._notifyScheduled) return;
  shared._notifyScheduled = true;
  queueMicrotask(() => {
    shared._notifyScheduled = false;
    for (const listener of shared.listeners) {
      listener();
    }
  });
}

/**
 * Memória transport: minden logot eltárol egy körkörös bufferben (`history`),
 * hogy a session végén exportálható legyen. A buffer mérete korlátozott
 * (`maxHistory`), hogy ne fusson el a memóriahasználat hosszan élő appban.
 */
function createMemoryTransport(shared) {
  return function memoryTransport(record) {
    shared.history.push(record);
    if (shared.history.length > shared.maxHistory) {
      shared.history.shift();
    }
  };
}

function safeStringify(value) {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

class Logger {
  /**
   * @param {object} shared - megosztott állapot (level, transports)
   * @param {string} scopeName - ennek a logger példánynak a scope neve
   */
  constructor(shared, scopeName = "") {
    this._shared = shared;
    this.scopeName = scopeName;
  }

  get level() {
    return this._shared.level;
  }

  setLevel(level) {
    this._shared.level = level;
  }

  /**
   * Új, alárendelt scope létrehozása. A visszaadott logger UGYANAZT
   * a megosztott állapotot használja, tehát setLevel() vagy addTransport()
   * hívás mindenhol érvényesül, függetlenül attól, hogy melyik scope-on hívtad.
   */
  scope(name) {
    const nested = this.scopeName ? `${this.scopeName}:${name}` : name;
    return new Logger(this._shared, nested);
  }

  addTransport(transportFn) {
    this._shared.transports.push(transportFn);
  }

  removeTransport(transportFn) {
    this._shared.transports = this._shared.transports.filter((t) => t !== transportFn);
  }

  /** A memóriában tárolt logok másolata (idő szerint növekvő sorrendben). */
  getLogs() {
    return [...this._shared.history];
  }

  clearLogs() {
    this._shared.history = [];
    notify(this._shared);
  }

  /**
   * Feliratkozás új logokra (pl. React UI frissítéséhez).
   * Visszaad egy leiratkozó függvényt.
   */
  subscribe(callback) {
    this._shared.listeners.add(callback);
    return () => this._shared.listeners.delete(callback);
  }

  /**
   * A tárolt logokat fájlba exportálja (böngészőben letöltésként), és
   * a tartalmat stringként is visszaadja (pl. ha inkább magad kezelnéd).
   *
   * @param {"json"|"text"} format
   */
  exportLogs(format = "json") {
    const logs = this.getLogs();
    let content;
    let mime;
    let ext;

    if (format === "text") {
      content = logs
        .map((r) => {
          const scopeLabel = r.scope ? ` [${r.scope}]` : "";
          const extra = r.args.map(safeStringify).join(" ");
          return `${r.timestamp.toISOString()} ${r.levelName}${scopeLabel} ${safeStringify(r.message)}${extra ? " " + extra : ""}`;
        })
        .join("\n");
      mime = "text/plain";
      ext = "log";
    } else {
      content = JSON.stringify(
        logs.map((r) => ({ ...r, timestamp: r.timestamp.toISOString() })),
        null,
        2
      );
      mime = "application/json";
      ext = "json";
    }

    if (typeof document !== "undefined") {
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `logs-${Date.now()}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    }

    return content;
  }

  shouldLog(levelValue) {
    return levelValue >= this._shared.level;
  }

  _emit(levelName, message, args) {
    const meta = LEVEL_META[levelName];
    if (!this.shouldLog(meta.value)) return;

    const record = {
      level: meta.value,
      levelName,
      scope: this.scopeName,
      message,
      args,
      timestamp: new Date(),
    };

    for (const transport of this._shared.transports) {
      try {
        transport(record);
      } catch (err) {
        // Egy hibás transport ne törje el a többit vagy magát az appot.
        console.error("Logger transport hiba:", err);
      }
    }

    notify(this._shared);
  }

  debug(message, ...args) {
    this._emit("DEBUG", message, args);
  }

  info(message, ...args) {
    this._emit("INFO", message, args);
  }

  warn(message, ...args) {
    this._emit("WARN", message, args);
  }

  error(message, ...args) {
    // Ha Error objektumot kapunk, a stack is hasznos infó.
    if (message instanceof Error) {
      this._emit("ERROR", message.message, [message.stack, ...args]);
      return;
    }
    this._emit("ERROR", message, args);
  }

  group(title) {
    if (!this.shouldLog(LOG_LEVELS.DEBUG)) return;
    console.group(title);
  }

  groupEnd() {
    if (!this.shouldLog(LOG_LEVELS.DEBUG)) return;
    console.groupEnd();
  }

  table(data) {
    if (!this.shouldLog(LOG_LEVELS.DEBUG)) return;
    console.table(data);
  }

  time(label) {
    if (!this.shouldLog(LOG_LEVELS.DEBUG)) return;
    console.time(label);
  }

  timeEnd(label) {
    if (!this.shouldLog(LOG_LEVELS.DEBUG)) return;
    console.timeEnd(label);
  }
}

const DEFAULT_MAX_HISTORY = 1000;

const sharedState = createSharedState(DEFAULT_LEVEL, DEFAULT_MAX_HISTORY);
sharedState.transports.push(createMemoryTransport(sharedState));

const rootLogger = new Logger(sharedState, "");

export default rootLogger;
export { Logger };