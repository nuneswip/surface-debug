export function createCompactMode(loggerInstance) {
    const mode = {};
    loggerInstance.levels.forEach(level => {
        mode[level] = (msg, opt = {}) =>
            loggerInstance.log(level, msg, {
                timestamp: false,
                tag: false,
                ...opt
            });
    });
    return mode;
}
