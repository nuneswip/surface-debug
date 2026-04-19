import { getIndent } from "../utils/indent.mjs";

export function createGroupMethods(loggerInstance) {
    return {
        start: label => {
            console.log(`${getIndent(loggerInstance.groupLevel)}▼ ${label}`);
            loggerInstance.groupLevel++;
        },
        end: () => {
            if (loggerInstance.groupLevel > 0) loggerInstance.groupLevel--;
        }
    };
}
