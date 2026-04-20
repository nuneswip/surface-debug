export function createCompactMode(loggerInstance) {
    const mode = {};

    loggerInstance.levels.forEach(level => {
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
