export function createTimeMethods(loggerInstance) {
    return {
        start: label => {
            loggerInstance.timers.set(label, Date.now());
        },
        end: label => {
            const start = loggerInstance.timers.get(label);
            if (!start) return;
            const duration = Date.now() - start;
            loggerInstance.info(`⏱ ${label}: ${duration}ms`);
            loggerInstance.timers.delete(label);
        }
    };
}
