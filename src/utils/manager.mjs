// utils/manager.mjs
import process from "node:process";

let writeQueue = Promise.resolve();

function enqueueWrite(writeFn) {
    const result = writeQueue.then(() => writeFn());
    writeQueue = result.catch(() => {});
    return result;
}

function _writeRawLineSync(state, line, addNewline = true) {
    const out = line + (addNewline ? "\n" : "");

    if (state._activeLoading && state._spinnerInterval) {
        const width = state._spinnerWidth || 100;
        // 1. Clear the current spinner line
        process.stdout.write("\r" + " ".repeat(width) + "\r");
        // 2. Write the log (this will push the spinner down)
        process.stdout.write(out);
        // 3. Redraw the spinner on the new line (cursor is now at start of that line)
        const frame =
            state._spinnerFrames[
                state._spinnerFrameIndex % state._spinnerFrames.length
            ];
        const spinnerLine = `${frame} ${state._spinnerText}`;
        process.stdout.write("\r" + spinnerLine.padEnd(width));
        state._spinnerFrameIndex++;
        return;
    }

    if (state._activeProgress && state._progressData) {
        const { width, render } = state._progressData;
        const w = width || 100;
        process.stdout.write("\r" + " ".repeat(w) + "\r");
        process.stdout.write(out);
        if (typeof render === "function") render();
        return;
    }

    process.stdout.write(out);
}

export function formatArg(arg) {
    if (arg === null) return "null";
    if (arg === undefined) return "undefined";
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

export function formatDuration(ms) {
    const s = ms / 1000;
    if (s < 1) return `${ms}ms`;
    if (s < 60) return `${s.toFixed(1)}s`;
    const m = s / 60;
    if (m < 60) return `${Math.floor(m)}m ${Math.floor(s % 60)}s`;
    const h = m / 60;
    return `${Math.floor(h)}h ${Math.floor(m % 60)}m`;
}

export function formatTime(ms) {
    if (ms <= 0) return "0ms";
    const s = ms / 1000;
    if (s < 1) return `${Math.round(ms)}ms`;
    if (s < 60) return `${s.toFixed(1)}s`;
    const m = s / 60;
    if (m < 60) return `${Math.floor(m)}m ${Math.floor(s % 60)}s`;
    const h = m / 60;
    return `${Math.floor(h)}h ${Math.floor(m % 60)}m`;
}

export function formatNumber(n) {
    const abs = Math.abs(n);
    if (abs < 1000) return String(n);
    if (abs < 1e6) return `${(n / 1e3).toFixed(1)}k`;
    if (abs < 1e9) return `${(n / 1e6).toFixed(1)}M`;
    return n.toExponential(1);
}

export function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}

export function writeRawLine(state, line, addNewline = true) {
    return enqueueWrite(() => _writeRawLineSync(state, line, addNewline));
}

export function writeRawLines(state, lines) {
    return enqueueWrite(() => {
        for (const line of lines) {
            _writeRawLineSync(state, line, true);
        }
    });
}

export function startLoading(state, text, width, frames) {
    state._activeLoading = true;
    state._spinnerText = text;
    state._spinnerWidth = width;
    state._spinnerFrames = frames;
    state._spinnerFrameIndex = 0;
}

export function stopLoading(state) {
    state._activeLoading = false;
    state._spinnerText = null;
    state._spinnerWidth = null;
    state._spinnerFrames = null;
    state._spinnerFrameIndex = null;
}

export function startProgress(state, id, width, renderFn) {
    state._activeProgress = true;
    state._progressData = { id, width, render: renderFn };
}

export function stopProgress(state) {
    state._activeProgress = false;
    state._progressData = null;
}
