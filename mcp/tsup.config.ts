import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts"],
  format: ["esm"],
  dts: false,
  clean: true,
  splitting: false,
  sourcemap: true,
  minify: false,
  target: "node18",
});
