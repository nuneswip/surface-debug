import { DEFAULT_ICONS } from "../config/icons.mjs";

export function getIcon(level, options) {
    if (!options.icons) return "";

    const iconSet = {
        ...DEFAULT_ICONS,
        ...options.iconSet
    };

    const icon = iconSet[level];
    return icon ? icon + " " : "";
}
