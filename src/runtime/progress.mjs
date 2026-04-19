import process from "node:process";
import { getIcon } from "../format/icon.mjs";

function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}

function formatNumber(n) {
    const abs = Math.abs(n);

    if (abs < 1000) return String(n);
    if (abs < 1e6) return `${(n / 1e3).toFixed(1)}k`;
    if (abs < 1e9) return `${(n / 1e6).toFixed(1)}M`;
    return n.toExponential(1);
}

function formatTime(ms) {
    if (ms <= 0) return "0ms";

    const s = ms / 1000;
    if (s < 1) return `${Math.round(ms)}ms`;
    if (s < 60) return `${s.toFixed(1)}s`;

    const m = s / 60;
    if (m < 60) return `${Math.floor(m)}m ${Math.floor(s % 60)}s`;

    const h = m / 60;
    return `${Math.floor(h)}h ${Math.floor(m % 60)}m`;
}

export function createProgressMethod(loggerInstance) {
    loggerInstance.queue ??= Promise.resolve();

    const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

    const width = process.stdout.columns || 100;

    return function progress(id, run) {
        loggerInstance.queue = loggerInstance.queue.then(() => {
            return new Promise((resolve, reject) => {
                let value = 0;
                let max = null;

                let frame = 0;
                let running = true;

                const startTime = Date.now();

                const iconSuccess = getIcon("success", loggerInstance?.options);
                const iconError = getIcon("error", loggerInstance?.options);

                const render = () => {
                    if (!running) return;

                    let line = "";

                    // UNKNOWN MODE
                    if (max == null) {
                        line = `${frames[frame++ % frames.length]} ${id} │ ${value ? formatNumber(value) : ""}`;
                    } else {
                        const safeMax = max || 100;
                        const safeValue = Math.min(value, safeMax);

                        const ratio = safeValue / safeMax;
                        const percent = Math.floor(clamp(ratio, 0, 1) * 100);

                        const size = 20;
                        const filled = Math.round((percent / 100) * size);
                        const empty = size - filled;

                        const bar = "█".repeat(filled) + "░".repeat(empty);

                        let eta = "calculating...";

                        if (safeValue >= safeMax) {
                            eta = "0ms";
                        } else if (safeValue > 0) {
                            const rate = (Date.now() - startTime) / safeValue;
                            const remaining = (safeMax - safeValue) * rate;
                            eta = formatTime(remaining);
                        }

                        line =
                            `${frames[frame++ % frames.length]} ${id} │ [${bar}] ` +
                            `${formatNumber(safeValue)}/${formatNumber(safeMax)} | ${percent}% | ETA ${eta}`;
                    }

                    process.stdout.write("\r" + line.padEnd(width));
                };

                const interval = setInterval(render, 80);

                const stop = () => {
                    running = false;
                    clearInterval(interval);
                    process.stdout.write("\r" + " ".repeat(width) + "\r");
                };

                try {
                    const result = run({
                        setValue(v) {
                            value = v;
                        },
                        setMax(m) {
                            if (m != null) max = m;
                        },
                        progressEnd() {
                            stop();

                            const duration = formatTime(Date.now() - startTime);
                            process.stdout.write(
                                `${iconSuccess || "✔ "}${id} (${duration})\n`
                            );

                            resolve();
                        }
                    });

                    Promise.resolve(result)
                        .then(res => {
                            stop();

                            const duration = formatTime(Date.now() - startTime);
                            process.stdout.write(
                                `${iconSuccess || "✔ "}${id} (${duration})\n`
                            );

                            resolve(res);
                        })
                        .catch(err => {
                            stop();
                            process.stdout.write(`${iconError || "✖ "}${id}\n`);
                            reject(err);
                        });
                } catch (err) {
                    stop();
                    reject(err);
                }
            });
        });

        return loggerInstance.queue;
    };
}
