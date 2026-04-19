export function formatTag(level, enabled) {
    if (!enabled) return "";
    return `[${level.toUpperCase()}] `;
}
