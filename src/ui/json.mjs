import chalk from "chalk";

export function createJSONMode(loggerInstance) {
    const json = {};

    const colorize = obj => {
        return (
            JSON.stringify(obj, null, 2)
                // keys
                .replace(
                    /"([^"]+)":/g,
                    (_, key) => chalk.gray(`"${key}"`) + ":"
                )
                // strings
                .replace(
                    /: "([^"]*)"/g,
                    (_, val) => `: ${chalk.green(`"${val}"`)}`
                )
                // numbers
                .replace(/: (\d+)/g, (_, num) => `: ${chalk.yellow(num)}`)
                // boolean/null
                .replace(
                    /: (true|false|null)/g,
                    (_, val) => `: ${chalk.magenta(val)}`
                )
        );
    };

    loggerInstance.levels.forEach(level => {
        json[level] = (msg, data = {}) => {
            const output = {
                level,
                message: msg,
                timestamp: new Date().toISOString(),
                ...data
            };

            console.log(colorize(output));
        };
    });

    return json;
}
