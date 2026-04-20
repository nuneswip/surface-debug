import {
    formatDuration,
    startLoading,
    stopLoading,
    writeRawLine
} from "../utils/manager.mjs";

export function createLoadingMethod(loggerInstance) {
    let currentPromise = Promise.resolve();
    const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

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

        currentPromise = resultPromise.catch(() => {});
        return resultPromise;
    };
}
