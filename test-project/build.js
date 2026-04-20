import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const testDir = path.resolve("test-project");

const packedFile = execSync("npm pack", {
    encoding: "utf8"
}).trim();

const packedPath = path.resolve(packedFile);
const destPath = path.join(testDir, packedFile);

fs.mkdirSync(testDir, { recursive: true });

const nodeModules = path.join(testDir, "node_modules");
const lockFile = path.join(testDir, "package-lock.json");

if (fs.existsSync(nodeModules)) {
    fs.rmSync(nodeModules, { recursive: true, force: true });
}

if (fs.existsSync(lockFile)) {
    fs.rmSync(lockFile, { force: true });
}

if (fs.existsSync(destPath)) {
    fs.rmSync(destPath, { force: true });
}

fs.renameSync(packedPath, destPath);

execSync(`npm install "${destPath}" --no-save --no-package-lock`, {
    cwd: testDir,
    stdio: "inherit"
});

execSync("node index.js", {
    cwd: testDir,
    stdio: "inherit"
});
