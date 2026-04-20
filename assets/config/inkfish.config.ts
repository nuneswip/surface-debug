// inkfish.config.ts
import type { InkfishConfig } from "@nuneswip/inkfish";

const config: InkfishConfig = {
    timestamp: true,
    icons: true,
    tag: true,
    theme: {
        info: "cyan",
        warn: "yellow",
        error: "red",
        success: "green",
        debug: "magenta",
        conn: "blue"
    },
    iconSet: {
        info: "ℹ",
        warn: "⚠",
        error: "✖",
        success: "✔",
        debug: "🐛",
        conn: "🔌"
    }
};

export default config;
