import { getIcon } from "../format/icon.mjs";

export function createBoxMethods(loggerInstance) {
    const box = {};

    loggerInstance.levels.forEach(level => {
        box[level] = msg => {
            const icon = getIcon(level, loggerInstance.options);
            const text = ` ${icon}${msg} `;
            const line = "─".repeat(text.length);
            console.log(`┌${line}┐`);
            console.log(`│${text}│`);
            console.log(`└${line}┘`);
        };
    });

    return box;
}
