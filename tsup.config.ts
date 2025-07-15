import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  dts: false, // Disable DTS generation to avoid shebang issues
  minify: true,
  splitting: false,
  bundle: true,
  external: ["sharp", "fs-extra"],
  platform: "node",
  banner: {
    js: "#!/usr/bin/env node",
  },
  env: {
    NODE_ENV: "production",
  },
});
