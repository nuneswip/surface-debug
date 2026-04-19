import { Logger } from "./core/class.mjs";

const inkfish = new Logger();

export { Logger as Core, inkfish };

export const logger = inkfish;
