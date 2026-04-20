import {
    formatNumber,
    clamp,
    formatTime,
    startProgress,
    stopProgress,
    writeRawLine
} from "../utils/manager.mjs";

export function createProgressMethod(loggerInstance) {
    let currentPromise = Promise.resolve();
    const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

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
                        return `${frames[frameIndex % frames.length]} ${id} │ ${value ? formatNumber(value) : ""}`;
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
                        return (
                            `${frames[frameIndex % frames.length]} ${id} │ [${bar}] ` +
                            `${formatNumber(safeValue)}/${formatNumber(safeMax)} | ${percent}% | ETA ${eta}`
                        );
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
                        loggerInstance
                            .success(`${id} (${duration})`)
                            .then(() => resolve());
                    }
                };

                try {
                    const result = run(api);
                    Promise.resolve(result)
                        .then(res => {
                            if (running) {
                                stop();
                                const duration = formatTime(
                                    Date.now() - startTime
                                );
                                loggerInstance
                                    .success(`${id} (${duration})`)
                                    .then(() => resolve(res));
                            }
                        })
                        .catch(err => {
                            if (running) {
                                stop();
                                loggerInstance
                                    .error(id)
                                    .then(() => reject(err));
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

        currentPromise = resultPromise.catch(() => {});
        return resultPromise;
    };
}
