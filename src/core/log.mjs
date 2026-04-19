import chalk from "chalk";
import { formatTimestamp } from "../format/timestamp.mjs";
import { formatTag } from "../format/tag.mjs";
import { getIcon } from "../format/icon.mjs";
import { getIndent } from "../utils/indent.mjs";
import { resolveTheme, blendColor } from "../format/theme.mjs";

export function createLogFunction(state) {
    return async function log(level, message, options = {}) {
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

        await console.log(
            indent +
                chalk.gray(timestamp) +
                color(icon + tag) +
                msgcolor(message)
        );
    };
}
