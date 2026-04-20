import chalk from 'chalk';
import colorName from 'color-name';
import process$1 from 'node:process';
import { join } from 'path';
import { existsSync } from 'fs';
import { createJiti } from 'jiti';

const DEFAULT_THEME = {
  info: "cyan",
  warn: "yellow",
  error: "red",
  success: "green",
  debug: "magenta",
  conn: "blue"
};

const DEFAULT_ICONS = {
  info: "\u2139",
  warn: "\u26A0",
  error: "\u2716",
  success: "\u2714",
  debug: "\u{1F41B}",
  conn: "\u{1F50C}"
};

const LEVELS = Object.keys(DEFAULT_THEME);

function formatTimestamp(enabled) {
  if (!enabled) return "";
  const d = /* @__PURE__ */ new Date();
  const time = [d.getHours(), d.getMinutes(), d.getSeconds()].map((n) => String(n).padStart(2, "0")).join(":");
  return `[${time}] `;
}

function formatTag(level, enabled) {
  if (!enabled) return "";
  return `[${level.toUpperCase()}] `;
}

function getIcon(level, options) {
  if (!options.icons) return "";
  const iconSet = {
    ...DEFAULT_ICONS,
    ...options.iconSet
  };
  const icon = iconSet[level];
  return icon ? icon + " " : "";
}

function getIndent(level) {
  return " ".repeat(level * 2);
}

function normalizeColorName(input) {
  if (!input || typeof input !== "string") return null;
  return input.replace(/Bright$/i, "").replace(/Dark$/i, "").toLowerCase();
}
function blendColor(input, strength = 0.75) {
  const mixWithWhite = ([r2, g2, b2]) => {
    const w = 255;
    return [
      Math.round(r2 + (w - r2) * strength),
      Math.round(g2 + (w - g2) * strength),
      Math.round(b2 + (w - b2) * strength)
    ];
  };
  let rgb;
  if (typeof input === "string" && input.startsWith("#")) {
    const hex = input.slice(1);
    const bigint = parseInt(hex, 16);
    rgb = [bigint >> 16 & 255, bigint >> 8 & 255, bigint & 255];
  } else {
    const normalized = normalizeColorName(input);
    if (normalized && colorName[normalized]) {
      rgb = colorName[normalized];
    } else {
      return chalk.white;
    }
  }
  const [r, g, b] = mixWithWhite(rgb);
  return chalk.rgb(r, g, b);
}
function resolveTheme(theme = {}) {
  return theme;
}

let writeQueue = Promise.resolve();
function enqueueWrite(writeFn) {
  const result = writeQueue.then(() => writeFn());
  writeQueue = result.catch(() => {
  });
  return result;
}
function _writeRawLineSync(state, line, addNewline = true) {
  const out = line + (addNewline ? "\n" : "");
  if (state._activeLoading && state._spinnerInterval) {
    const width = state._spinnerWidth || 100;
    process$1.stdout.write("\r" + " ".repeat(width) + "\r");
    process$1.stdout.write(out);
    const frame = state._spinnerFrames[state._spinnerFrameIndex % state._spinnerFrames.length];
    const spinnerLine = `${frame} ${state._spinnerText}`;
    process$1.stdout.write("\r" + spinnerLine.padEnd(width));
    state._spinnerFrameIndex++;
    return;
  }
  if (state._activeProgress && state._progressData) {
    const { width, render } = state._progressData;
    const w = width || 100;
    process$1.stdout.write("\r" + " ".repeat(w) + "\r");
    process$1.stdout.write(out);
    if (typeof render === "function") render();
    return;
  }
  process$1.stdout.write(out);
}
function formatArg(arg) {
  if (arg === null) return "null";
  if (arg === void 0) return "undefined";
  if (typeof arg === "object") {
    if (arg instanceof Error) return arg.stack || arg.message;
    if (Array.isArray(arg) || arg.constructor === Object) {
      try {
        return JSON.stringify(arg);
      } catch {
        return "[Circular]";
      }
    }
    return String(arg);
  }
  return String(arg);
}
function formatDuration(ms) {
  const s = ms / 1e3;
  if (s < 1) return `${ms}ms`;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = s / 60;
  if (m < 60) return `${Math.floor(m)}m ${Math.floor(s % 60)}s`;
  const h = m / 60;
  return `${Math.floor(h)}h ${Math.floor(m % 60)}m`;
}
function formatTime(ms) {
  if (ms <= 0) return "0ms";
  const s = ms / 1e3;
  if (s < 1) return `${Math.round(ms)}ms`;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = s / 60;
  if (m < 60) return `${Math.floor(m)}m ${Math.floor(s % 60)}s`;
  const h = m / 60;
  return `${Math.floor(h)}h ${Math.floor(m % 60)}m`;
}
function formatNumber(n) {
  const abs = Math.abs(n);
  if (abs < 1e3) return String(n);
  if (abs < 1e6) return `${(n / 1e3).toFixed(1)}k`;
  if (abs < 1e9) return `${(n / 1e6).toFixed(1)}M`;
  return n.toExponential(1);
}
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function writeRawLine(state, line, addNewline = true) {
  return enqueueWrite(() => _writeRawLineSync(state, line, addNewline));
}
function writeRawLines(state, lines) {
  return enqueueWrite(() => {
    for (const line of lines) {
      _writeRawLineSync(state, line, true);
    }
  });
}
function startLoading(state, text, width, frames) {
  state._activeLoading = true;
  state._spinnerText = text;
  state._spinnerWidth = width;
  state._spinnerFrames = frames;
  state._spinnerFrameIndex = 0;
}
function stopLoading(state) {
  state._activeLoading = false;
  state._spinnerText = null;
  state._spinnerWidth = null;
  state._spinnerFrames = null;
  state._spinnerFrameIndex = null;
}
function startProgress(state, id, width, renderFn) {
  state._activeProgress = true;
  state._progressData = { id, width, render: renderFn };
}
function stopProgress(state) {
  state._activeProgress = false;
  state._progressData = null;
}

function createLogFunction(state) {
  return function log(level, ...args) {
    let options = {};
    let messageArgs = args;
    const last = args[args.length - 1];
    if (last && typeof last === "object" && "__config" in last) {
      const { __config: _, ...rest } = last;
      options = rest;
      messageArgs = args.slice(0, -1);
    }
    let message = messageArgs.map(formatArg).join(" ");
    const merged = {
      ...state.options,
      ...options
    };
    const theme = resolveTheme(merged.theme);
    const color = chalk[theme[level]] || chalk.white;
    const msgcolor = blendColor(theme[level]) || chalk.white;
    const icon = getIcon(level, merged);
    const timestamp = formatTimestamp(merged.timestamp);
    const tag = formatTag(level, merged.tag);
    const indent = getIndent(state.groupLevel);
    const formattedLog = indent + chalk.gray(timestamp) + color(icon + tag) + msgcolor(message);
    return writeRawLine(state, formattedLog);
  };
}

function createGroupMethods(loggerInstance) {
  return {
    start: (label) => {
      console.log(`${getIndent(loggerInstance.groupLevel)}\u25BC ${label}`);
      loggerInstance.groupLevel++;
    },
    end: () => {
      if (loggerInstance.groupLevel > 0) loggerInstance.groupLevel--;
    }
  };
}

function createTimeMethods(loggerInstance) {
  return {
    start: (label) => {
      loggerInstance.timers.set(label, Date.now());
    },
    end: (label) => {
      const start = loggerInstance.timers.get(label);
      if (!start) return;
      const duration = Date.now() - start;
      loggerInstance.info(`\u23F1 ${label}: ${duration}ms`);
      loggerInstance.timers.delete(label);
    }
  };
}

function createLoadingMethod(loggerInstance) {
  let currentPromise = Promise.resolve();
  const frames = ["\u280B", "\u2819", "\u2839", "\u2838", "\u283C", "\u2834", "\u2826", "\u2827", "\u2807", "\u280F"];
  return function loading(text, run) {
    const resultPromise = currentPromise.then(async () => {
      const width = process.stdout.columns || 100;
      const start = Date.now();
      startLoading(loggerInstance, text, width, frames);
      let frameIndex = 0;
      const interval = setInterval(() => {
        const frame = frames[frameIndex++ % frames.length];
        const line = `${frame} ${text}`;
        process.stdout.write("\r" + line.padEnd(width));
      }, 80);
      loggerInstance._spinnerInterval = interval;
      const stop = () => {
        clearInterval(interval);
        loggerInstance._spinnerInterval = null;
        process.stdout.write("\r" + " ".repeat(width) + "\r");
        stopLoading(loggerInstance);
      };
      try {
        const result = await run();
        stop();
        const duration = formatDuration(Date.now() - start);
        await loggerInstance.success(`${text} (${duration})`);
        return result;
      } catch (err) {
        stop();
        await loggerInstance.error(text);
        throw err;
      }
    });
    currentPromise = resultPromise.catch(() => {
    });
    return resultPromise;
  };
}

function createProgressMethod(loggerInstance) {
  let currentPromise = Promise.resolve();
  const frames = ["\u280B", "\u2819", "\u2839", "\u2838", "\u283C", "\u2834", "\u2826", "\u2827", "\u2807", "\u280F"];
  return function progress(id, run) {
    const resultPromise = currentPromise.then(() => {
      return new Promise((resolve, reject) => {
        let value = 0;
        let max = null;
        let frameIndex = 0;
        let running = true;
        const startTime = Date.now();
        const width = process.stdout.columns || 100;
        const getCurrentLine = () => {
          if (max == null) {
            return `${frames[frameIndex % frames.length]} ${id} \u2502 ${value ? formatNumber(value) : ""}`;
          } else {
            const safeMax = max || 100;
            const safeValue = Math.min(value, safeMax);
            const ratio = safeValue / safeMax;
            const percent = Math.floor(clamp(ratio, 0, 1) * 100);
            const size = 20;
            const filled = Math.round(percent / 100 * size);
            const empty = size - filled;
            const bar = "\u2588".repeat(filled) + "\u2591".repeat(empty);
            let eta = "calculating...";
            if (safeValue >= safeMax) {
              eta = "0ms";
            } else if (safeValue > 0) {
              const rate = (Date.now() - startTime) / safeValue;
              const remaining = (safeMax - safeValue) * rate;
              eta = formatTime(remaining);
            }
            return `${frames[frameIndex % frames.length]} ${id} \u2502 [${bar}] ${formatNumber(safeValue)}/${formatNumber(safeMax)} | ${percent}% | ETA ${eta}`;
          }
        };
        const render = () => {
          if (!running) return;
          const line = getCurrentLine();
          process.stdout.write("\r" + line.padEnd(width));
          frameIndex++;
        };
        startProgress(loggerInstance, id, width, render);
        const interval = setInterval(render, 80);
        render();
        const stop = () => {
          running = false;
          clearInterval(interval);
          process.stdout.write("\r" + " ".repeat(width) + "\r");
          stopProgress(loggerInstance);
        };
        const api = {
          setValue(v) {
            value = v;
          },
          setMax(m) {
            if (m != null) max = m;
          },
          progressEnd() {
            if (!running) return;
            stop();
            const duration = formatTime(Date.now() - startTime);
            loggerInstance.success(`${id} (${duration})`).then(() => resolve());
          }
        };
        try {
          const result = run(api);
          Promise.resolve(result).then((res) => {
            if (running) {
              stop();
              const duration = formatTime(
                Date.now() - startTime
              );
              loggerInstance.success(`${id} (${duration})`).then(() => resolve(res));
            }
          }).catch((err) => {
            if (running) {
              stop();
              loggerInstance.error(id).then(() => reject(err));
            } else reject(err);
          });
        } catch (err) {
          if (running) {
            stop();
            reject(err);
          } else reject(err);
        }
      });
    });
    currentPromise = resultPromise.catch(() => {
    });
    return resultPromise;
  };
}

function createBoxMethods(loggerInstance) {
  const box = {};
  loggerInstance.levels.forEach((level) => {
    box[level] = (...args) => {
      let options = {};
      let messageArgs = args;
      const last = args[args.length - 1];
      if (last && typeof last === "object" && "__config" in last) {
        const { __config: _, ...rest } = last;
        options = rest;
        messageArgs = args.slice(0, -1);
      }
      let rawMessage = messageArgs.map(formatArg).join(" ");
      const lines = rawMessage.split("\n");
      const icon = getIcon(level, {
        ...loggerInstance.options,
        ...options
      });
      const prefix = ` ${icon} `;
      const contentLines = lines.map((line) => prefix + line);
      const maxWidth = Math.max(...contentLines.map((l) => l.length), 0);
      const horizontalBorder = "\u2500".repeat(maxWidth);
      const top = `\u250C${horizontalBorder}\u2510`;
      const bottom = `\u2514${horizontalBorder}\u2518`;
      const outputLines = [top];
      for (const line of contentLines) {
        const padded = line + " ".repeat(maxWidth - line.length);
        outputLines.push(`\u2502${padded}\u2502`);
      }
      outputLines.push(bottom);
      return writeRawLines(loggerInstance, outputLines);
    };
  });
  return box;
}

function createCompactMode(loggerInstance) {
  const mode = {};
  loggerInstance.levels.forEach((level) => {
    mode[level] = (...args) => {
      return loggerInstance.log(level, ...args, {
        __config: true,
        timestamp: false,
        tag: false
      });
    };
  });
  return mode;
}

function colorizeJSON(obj) {
  return JSON.stringify(obj, null, 2).replace(/"([^"]+)":/g, (_, key) => chalk.gray(`"${key}"`) + ":").replace(/: "([^"]*)"/g, (_, val) => `: ${chalk.green(`"${val}"`)}`).replace(/: (\d+)/g, (_, num) => `: ${chalk.yellow(num)}`).replace(/: (true|false|null)/g, (_, val) => `: ${chalk.magenta(val)}`);
}
function createJSONMode(loggerInstance) {
  const json = {};
  loggerInstance.levels.forEach((level) => {
    json[level] = (...args) => {
      let options = {};
      let messageArgs = args;
      const last = args[args.length - 1];
      if (last && typeof last === "object" && "__config" in last) {
        const { __config: _, ...rest } = last;
        options = rest;
        messageArgs = args.slice(0, -1);
      }
      let message = messageArgs.map(formatArg).join(" ");
      let extraData = {};
      if (messageArgs.length > 0) {
        const potentialData = messageArgs[messageArgs.length - 1];
        if (potentialData && typeof potentialData === "object" && !Array.isArray(potentialData) && !("__config" in potentialData)) {
          extraData = potentialData;
          message = messageArgs.slice(0, -1).map(formatArg).join(" ");
        }
      }
      const output = {
        level,
        message,
        timestamp: formatTimestamp(options.timestamp !== false),
        ...extraData
      };
      if (options.timestamp === false) {
        delete output.timestamp;
      }
      const coloredJson = colorizeJSON(output);
      const lines = coloredJson.split("\n");
      return writeRawLines(loggerInstance, lines);
    };
  });
  return json;
}

const configFiles = [
  "inkfish.config.ts",
  "inkfish.config.js",
  "inkfish.config.mjs",
  "inkfish.config.cjs"
];
function deepMerge(target, source) {
  if (!source) return target;
  const output = { ...target };
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const srcVal = source[key];
      const tgtVal = target[key];
      if (srcVal && typeof srcVal === "object" && !Array.isArray(srcVal) && tgtVal && typeof tgtVal === "object") {
        output[key] = deepMerge(tgtVal, srcVal);
      } else {
        output[key] = srcVal;
      }
    }
  }
  return output;
}
function loadInkfishConfigSync(cwd = process.cwd(), defaults = {}) {
  let configPath = null;
  for (const file of configFiles) {
    const fullPath = join(cwd, file);
    if (existsSync(fullPath)) {
      configPath = fullPath;
      break;
    }
  }
  let userConfig = {};
  if (configPath) {
    const jiti = createJiti(cwd, { interopDefault: true, sync: true });
    try {
      let loaded = jiti(configPath);
      if (typeof loaded === "function") {
        loaded = loaded();
      }
      userConfig = loaded || {};
    } catch (err) {
      console.error(`Error loading config from ${configPath}:`, err);
    }
  }
  return deepMerge(defaults, userConfig);
}

class Core {
  constructor(options = {}) {
    const autoLoad = options.configFile !== false;
    const fileConfig = autoLoad ? loadInkfishConfigSync(process.cwd(), {}) : {};
    this.options = {
      timestamp: true,
      icons: true,
      tag: true,
      theme: DEFAULT_THEME,
      iconSet: DEFAULT_ICONS,
      ...fileConfig,
      ...options
    };
    delete this.options.configFile;
    this._activeLoading = false;
    this._spinnerInterval = null;
    this._spinnerFrames = null;
    this._spinnerFrameIndex = 0;
    this._spinnerText = "";
    this._spinnerWidth = 0;
    this._activeProgress = false;
    this._progressData = null;
    this.levels = LEVELS;
    this.timers = /* @__PURE__ */ new Map();
    this.groupLevel = 0;
    this.queue = Promise.resolve();
    this.log = createLogFunction(this);
    this.levels.forEach((level) => {
      this[level] = (...args) => this.log(level, ...args);
    });
    this.error;
    this.error = (msg, opt) => {
      const error = msg instanceof Error ? `${msg.message}
${msg.stack}` : msg;
      this.log("error", error, opt);
    };
    this.compact = createCompactMode(this);
    this.box = createBoxMethods(this);
    this.json = createJSONMode(this);
    this.group = createGroupMethods(this);
    this.time = createTimeMethods(this);
    this.loading = createLoadingMethod(this);
    this.progress = createProgressMethod(this);
  }
  setTheme(theme) {
    this.options.theme = { ...this.options.theme, ...theme };
  }
  setOptions(options) {
    this.options = {
      ...this.options,
      ...options,
      iconSet: options.iconSet ? { ...this.options.iconSet, ...options.iconSet } : this.options.iconSet
    };
  }
}

const inkfish = new Core();
const logger = inkfish;

export { Core, inkfish, logger };
