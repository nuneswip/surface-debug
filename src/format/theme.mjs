import chalk from "chalk";
import colorName from "color-name";

function normalizeColorName(input) {
    if (!input || typeof input !== "string") return null;

    return input
        .replace(/Bright$/i, "")
        .replace(/Dark$/i, "")
        .toLowerCase();
}

export function applyColor(text, color) {
    const fn = chalk[color] || chalk.white;
    return fn(text);
}

export function blendColor(input, strength = 0.75) {
    const mixWithWhite = ([r, g, b]) => {
        const w = 255;

        return [
            Math.round(r + (w - r) * strength),
            Math.round(g + (w - g) * strength),
            Math.round(b + (w - b) * strength)
        ];
    };

    let rgb;

    if (typeof input === "string" && input.startsWith("#")) {
        const hex = input.slice(1);
        const bigint = parseInt(hex, 16);

        rgb = [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    } else {
        const normalized = normalizeColorName(input);

        if (normalized && colorName[normalized]) {
            rgb = colorName[normalized];
        } else {
            return chalk.white;
        }
    }

    const [r, g, b] = mixWithWhite(rgb);
    return chalk.rgb(r, g, b);
}

export function resolveTheme(theme = {}) {
    return theme;
}
