import chalk from "chalk";
import { formatTimestamp } from "../format/timestamp.mjs";
import { formatArg, writeRawLines } from "../utils/manager.mjs";

function colorizeJSON(obj) {
    return JSON.stringify(obj, null, 2)
        .replace(/"([^"]+)":/g, (_, key) => chalk.gray(`"${key}"`) + ":")
        .replace(/: "([^"]*)"/g, (_, val) => `: ${chalk.green(`"${val}"`)}`)
        .replace(/: (\d+)/g, (_, num) => `: ${chalk.yellow(num)}`)
        .replace(/: (true|false|null)/g, (_, val) => `: ${chalk.magenta(val)}`);
}

export function createJSONMode(loggerInstance) {
    const json = {};

    loggerInstance.levels.forEach(level => {
        json[level] = (...args) => {
            let options = {};
            let messageArgs = args;
            const last = args[args.length - 1];
            if (last && typeof last === "object" && "__config" in last) {
                const { __config: _, ...rest } = last;
                options = rest;
                messageArgs = args.slice(0, -1);
            }

            let message = messageArgs.map(formatArg).join(" ");

            let extraData = {};
            if (messageArgs.length > 0) {
                const potentialData = messageArgs[messageArgs.length - 1];
                if (
                    potentialData &&
                    typeof potentialData === "object" &&
                    !Array.isArray(potentialData) &&
                    !("__config" in potentialData)
                ) {
                    extraData = potentialData;
                    message = messageArgs.slice(0, -1).map(formatArg).join(" ");
                }
            }

            const output = {
                level,
                message,
                timestamp: formatTimestamp(options.timestamp !== false),
                ...extraData
            };

            if (options.timestamp === false) {
                delete output.timestamp;
            }

            const coloredJson = colorizeJSON(output);
            const lines = coloredJson.split("\n");
            return writeRawLines(loggerInstance, lines);
        };
    });

    return json;
}
