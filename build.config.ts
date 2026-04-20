import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
    entries: ["src/index"],
    clean: true,
    declaration: true,
    sourcemap: false,
    rollup: {
        emitCJS: true,
        inlineDependencies: true,
        treeshake: true
    }
});
