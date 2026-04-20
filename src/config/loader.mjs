import { join } from "path";
import { existsSync } from "fs";
import { createJiti } from "jiti";

const configFiles = [
    "inkfish.config.ts",
    "inkfish.config.js",
    "inkfish.config.mjs",
    "inkfish.config.cjs"
];

function deepMerge(target, source) {
    if (!source) return target;
    const output = { ...target };
    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            const srcVal = source[key];
            const tgtVal = target[key];
            if (
                srcVal &&
                typeof srcVal === "object" &&
                !Array.isArray(srcVal) &&
                tgtVal &&
                typeof tgtVal === "object"
            ) {
                output[key] = deepMerge(tgtVal, srcVal);
            } else {
                output[key] = srcVal;
            }
        }
    }
    return output;
}

export function loadInkfishConfigSync(cwd = process.cwd(), defaults = {}) {
    let configPath = null;
    for (const file of configFiles) {
        const fullPath = join(cwd, file);
        if (existsSync(fullPath)) {
            configPath = fullPath;
            break;
        }
    }

    let userConfig = {};
    if (configPath) {
        const jiti = createJiti(cwd, { interopDefault: true, sync: true });
        try {
            let loaded = jiti(configPath);
            if (typeof loaded === "function") {
                loaded = loaded();
            }
            userConfig = loaded || {};
        } catch (err) {
            console.error(`Error loading config from ${configPath}:`, err);
        }
    }

    return deepMerge(defaults, userConfig);
}
