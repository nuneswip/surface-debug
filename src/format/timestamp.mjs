export function formatTimestamp(enabled) {
    if (!enabled) return "";

    const d = new Date();
    const time = [d.getHours(), d.getMinutes(), d.getSeconds()]
        .map(n => String(n).padStart(2, "0"))
        .join(":");

    return `[${time}] `;
}
