import { DEFAULT_THEME } from "../config/theme.mjs";
import { DEFAULT_ICONS } from "../config/icons.mjs";
import { LEVELS } from "./levels.mjs";
import { createLogFunction } from "./log.mjs";
import { createGroupMethods } from "../runtime/group.mjs";
import { createTimeMethods } from "../runtime/time.mjs";
import { createLoadingMethod } from "../runtime/loading.mjs";
import { createProgressMethod } from "../runtime/progress.mjs";
import { createBoxMethods } from "../ui/box.mjs";
import { createCompactMode } from "../ui/compact.mjs";
import { createJSONMode } from "../ui/json.mjs";
import { loadInkfishConfigSync } from "../config/loader.mjs";

export class Core {
    constructor(options = {}) {
        const autoLoad = options.configFile !== false;
        const fileConfig = autoLoad
            ? loadInkfishConfigSync(process.cwd(), {})
            : {};

        this.options = {
            timestamp: true,
            icons: true,
            tag: true,
            theme: DEFAULT_THEME,
            iconSet: DEFAULT_ICONS,
            ...fileConfig,
            ...options
        };

        delete this.options.configFile;

        this._activeLoading = false;
        this._spinnerInterval = null;
        this._spinnerFrames = null;
        this._spinnerFrameIndex = 0;
        this._spinnerText = "";
        this._spinnerWidth = 0;
        this._activeProgress = false;
        this._progressData = null;

        this.levels = LEVELS;
        this.timers = new Map();
        this.groupLevel = 0;

        this.queue = Promise.resolve();

        this.log = createLogFunction(this);

        this.levels.forEach(level => {
            this[level] = (...args) => this.log(level, ...args);
        });

        const originalError = this.error;
        this.error = (msg, opt) => {
            const error =
                msg instanceof Error ? `${msg.message}\n${msg.stack}` : msg;
            this.log("error", error, opt);
        };

        this.compact = createCompactMode(this);
        this.box = createBoxMethods(this);
        this.json = createJSONMode(this);

        this.group = createGroupMethods(this);
        this.time = createTimeMethods(this);
        this.loading = createLoadingMethod(this);
        this.progress = createProgressMethod(this);
    }

    setTheme(theme) {
        this.options.theme = { ...this.options.theme, ...theme };
    }

    setOptions(options) {
        this.options = {
            ...this.options,
            ...options,
            iconSet: options.iconSet
                ? { ...this.options.iconSet, ...options.iconSet }
                : this.options.iconSet
        };
    }
}
