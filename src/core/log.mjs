import chalk from "chalk";
import { formatTimestamp } from "../format/timestamp.mjs";
import { formatTag } from "../format/tag.mjs";
import { getIcon } from "../format/icon.mjs";
import { getIndent } from "../utils/indent.mjs";
import { resolveTheme, blendColor } from "../format/theme.mjs";
import { formatArg, writeRawLine } from "../utils/manager.mjs";

export function createLogFunction(state) {
    return function log(level, ...args) {
        let options = {};
        let messageArgs = args;

        const last = args[args.length - 1];
        if (last && typeof last === "object" && "__config" in last) {
            const { __config: _, ...rest } = last;
            options = rest;
            messageArgs = args.slice(0, -1);
        }

        let message = messageArgs.map(formatArg).join(" ");

        const merged = {
            ...state.options,
            ...options
        };

        const theme = resolveTheme(merged.theme);
        const color = chalk[theme[level]] || chalk.white;
        const msgcolor = blendColor(theme[level]) || chalk.white;
        const icon = getIcon(level, merged);
        const timestamp = formatTimestamp(merged.timestamp);
        const tag = formatTag(level, merged.tag);
        const indent = getIndent(state.groupLevel);

        const formattedLog =
            indent +
            chalk.gray(timestamp) +
            color(icon + tag) +
            msgcolor(message);

        return writeRawLine(state, formattedLog);
    };
}
