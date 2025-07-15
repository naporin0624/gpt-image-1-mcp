import { defineConfig } from "tsup";

import { version } from "./package.json";

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
  external: ["fs-extra"],
  platform: "node",
  banner: {
    js: "#!/usr/bin/env node",
  },
  env: {
    NODE_ENV: "production",
    PACKAGE_VERSION: version,
  },
});
