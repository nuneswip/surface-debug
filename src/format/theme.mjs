import chalk from "chalk";
import colorName from "color-name";

export function applyColor(text, colorName) {
    const colorFn = chalk[colorName] || chalk.white;
    return colorFn(text);
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
        const hex = input.replace("#", "");
        const bigint = parseInt(hex, 16);

        rgb = [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    } else if (colorName[input]) {
        rgb = colorName[input];
    } else {
        return chalk.white;
    }

    const [r, g, b] = mixWithWhite(rgb);

    return chalk.rgb(r, g, b);
}

export function resolveTheme(theme = {}) {
    return theme;
}
