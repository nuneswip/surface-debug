import { getIcon } from "../format/icon.mjs";
import { formatArg, writeRawLines } from "../utils/manager.mjs";

export function createBoxMethods(loggerInstance) {
    const box = {};

    loggerInstance.levels.forEach(level => {
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
            const contentLines = lines.map(line => prefix + line);
            const maxWidth = Math.max(...contentLines.map(l => l.length), 0);
            const horizontalBorder = "─".repeat(maxWidth);
            const top = `┌${horizontalBorder}┐`;
            const bottom = `└${horizontalBorder}┘`;

            const outputLines = [top];
            for (const line of contentLines) {
                const padded = line + " ".repeat(maxWidth - line.length);
                outputLines.push(`│${padded}│`);
            }
            outputLines.push(bottom);

            return writeRawLines(loggerInstance, outputLines);
        };
    });

    return box;
}
