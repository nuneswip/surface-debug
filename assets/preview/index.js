/**
 * Inkfish Preview (Using real data)
 *
 * This script runs a real execution flow using runtime data from
 * Node.js, filesystem, and npm registry. No mocked values are used.
 *
 * All information (versions, file sizes, network status, memory)
 * is retrieved at runtime.
 *
 * Sleep delays are only for visual preview and do not affect logic.
 *
 * In production, these delays should be removed.
 *
 * This preview demonstrates:
 * - npm registry dependency resolution
 * - filesystem operations
 * - Node.js runtime metrics
 */

import { inkfish } from "@nuneswip/inkfish";
import fs from "fs/promises";
import path from "path";
import os from "os";

const sleep = ms => new Promise(r => setTimeout(r, ms));
const workspace = path.join(os.tmpdir(), "inkfish-demo");

const delay = {
    step: () => sleep(300),
    network: () => sleep(500),
    file: () => sleep(250),
    compact: () => sleep(120)
};

console.log();

inkfish.info("Inkfish CLI v1.0.0");
inkfish.info("Node", process.version);
inkfish.info("Platform", process.platform);
inkfish.info("Arch", process.arch);

const mem0 = process.memoryUsage();

inkfish.debug("Memory", {
    rss: `${Math.round(mem0.rss / 1024 / 1024)}MB`,
    heap: `${Math.round(mem0.heapUsed / 1024 / 1024)}MB`
});

await delay.step();

inkfish.info("Initializing workspace");

await inkfish.loading("filesystem", async () => {
    await delay.step();
    await fs.mkdir(workspace, { recursive: true });
});

await inkfish.loading("config.json", async () => {
    await delay.file();
    await fs.writeFile(
        path.join(workspace, "config.json"),
        JSON.stringify(
            {
                name: "inkfish-demo",
                version: "1.0.0",
                node: process.version
            },
            null,
            2
        )
    );
});

inkfish.success("Workspace ready");

await delay.step();

inkfish.info("Resolving dependencies");

const deps = ["chalk", "kleur", "ora", "strip-ansi"];

await inkfish.progress("install", async ({ setValue, setMax }) => {
    setMax(deps.length);

    let i = 0;

    for (const dep of deps) {
        await delay.network();

        const res = await fetch(`https://registry.npmjs.org/${dep}`);
        const data = await res.json();

        const latest = data["dist-tags"]?.latest;
        const version = data.versions?.[latest];
        const size = version?.dist?.unpackedSize;

        inkfish.compact.info("resolved", `${dep}@${latest}`);
        await delay.compact();

        if (size) {
            inkfish.compact.info("size", `${Math.round(size / 1024)}KB`);
        }

        await delay.step();
        setValue(++i);
    }
});

inkfish.success("Dependencies resolved");

await delay.step();

inkfish.info("Building project");

inkfish.time.start("build");

const files = ["index.js", "logger.js", "utils.js", "config.js", "cli.js"];

await inkfish.progress("build", async ({ setValue, setMax }) => {
    setMax(files.length);

    let i = 0;

    for (const file of files) {
        const filePath = path.join(workspace, file);

        const content = `// ${file}\nexport const file = "${file}";\nexport const ts = ${Date.now()};`;

        await fs.writeFile(filePath, content);
        await delay.file();

        const stat = await fs.stat(filePath);

        inkfish.compact.info("written", `${file} (${stat.size}B)`);

        await delay.step();
        setValue(++i);
    }
});

inkfish.time.end("build");

inkfish.success("Build complete");

await delay.step();

inkfish.info("Checking network");

const net = await inkfish.loading("registry", async () => {
    await delay.network();
    const res = await fetch("https://registry.npmjs.org");
    return res.status;
});

inkfish.success("Registry status", net);

await delay.step();

const mem1 = process.memoryUsage();

inkfish.debug("Final metrics", {
    uptime: `${Math.round(process.uptime())}s`,
    rss: `${Math.round(mem1.rss / 1024 / 1024)}MB`,
    heap: `${Math.round(mem1.heapUsed / 1024 / 1024)}MB`
});

await delay.step();

inkfish.info("Cleaning workspace");

await inkfish.loading("removal", async () => {
    await delay.step();
    await fs.rm(workspace, { recursive: true, force: true });
});

inkfish.success("Done");
