// logger.js

export const LOG_LEVELS = Object.freeze({
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 99,
});

const DEFAULT_LEVEL = import.meta.env.DEV
  ? LOG_LEVELS.DEBUG
  : LOG_LEVELS.WARN;

const LEVELS = {
  DEBUG: {
    value: LOG_LEVELS.DEBUG,
    method: "log",
    style: "color:#9CA3AF;font-weight:bold;", // szürke
  },
  INFO: {
    value: LOG_LEVELS.INFO,
    method: "info",
    style: "color:#2563EB;font-weight:bold;", // kék
  },
  WARN: {
    value: LOG_LEVELS.WARN,
    method: "warn",
    style: "color:#D97706;font-weight:bold;", // narancs
  },
  ERROR: {
    value: LOG_LEVELS.ERROR,
    method: "error",
    style: "color:#DC2626;font-weight:bold;", // piros
  },
};

class Logger {
  constructor(level = DEFAULT_LEVEL, scope = "") {
    this.level = level;
    this.scopeName = scope;
  }

  setLevel(level) {
    this.level = level;
  }

  scope(name) {
    return new Logger(this.level, name);
  }

  shouldLog(level) {
    return level >= this.level;
  }

  log(levelName, message, ...args) {
    const cfg = LEVELS[levelName];

    if (!this.shouldLog(cfg.value)) return;

    const time = new Date().toLocaleTimeString("hu-HU", {
      hour12: false,
    });

    const scope = this.scopeName
      ? ` [${this.scopeName}]`
      : "";

    console[cfg.method](
      `%c${time} ${levelName}${scope}`,
      cfg.style,
      message,
      ...args
    );
  }

  debug(message, ...args) {
    this.log("DEBUG", message, ...args);
  }

  info(message, ...args) {
    this.log("INFO", message, ...args);
  }

  warn(message, ...args) {
    this.log("WARN", message, ...args);
  }

  error(message, ...args) {
    this.log("ERROR", message, ...args);
  }

  group(title) {
    console.group(title);
  }

  groupEnd() {
    console.groupEnd();
  }

  table(data) {
    console.table(data);
  }

  time(label) {
    console.time(label);
  }

  timeEnd(label) {
    console.timeEnd(label);
  }
}

export default new Logger();