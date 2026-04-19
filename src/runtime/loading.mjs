import process from "node:process";
import { getIcon } from "../format/icon.mjs";

function formatDuration(ms) {
    const s = ms / 1000;
    if (s < 1) return `${ms}ms`;
    if (s < 60) return `${s.toFixed(1)}s`;

    const m = s / 60;
    if (m < 60) return `${Math.floor(m)}m ${Math.floor(s % 60)}s`;

    const h = m / 60;
    return `${Math.floor(h)}h ${Math.floor(m % 60)}m`;
}

export function createLoadingMethod(loggerInstance) {
    loggerInstance.queue ??= Promise.resolve();

    return function loading(text, run) {
        loggerInstance.queue = loggerInstance.queue.then(async () => {
            const iconSuccess = getIcon("success", loggerInstance?.options);
            const iconError = getIcon("error", loggerInstance?.options);

            const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
            let i = 0;

            const start = Date.now();
            const width = process.stdout.columns || 100;

            const interval = setInterval(() => {
                const line = `${frames[i++ % frames.length]} ${text}`;

                process.stdout.write("\r" + line.padEnd(width));
            }, 80);

            const stop = () => {
                clearInterval(interval);
                process.stdout.write("\r" + " ".repeat(width) + "\r");
            };

            try {
                const result = await run();

                stop();

                const duration = formatDuration(Date.now() - start);

                process.stdout.write(
                    `${iconSuccess || "✔ "}${text} (${duration})\n`
                );

                return result;
            } catch (err) {
                stop();

                const duration = formatDuration(Date.now() - start);

                process.stdout.write(
                    `${iconError || "✖ "}${text} (${duration})\n`
                );

                throw err;
            }
        });

        return loggerInstance.queue;
    };
}
