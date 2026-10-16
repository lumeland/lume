import { defineConfig } from "vitest/config";

export default defineConfig({
  oxc: {
    jsx: {
      runtime: "automatic",
      importSource: "@lumeland/ssx",
      development: false,
    },
  },
  test: {
    projects: ["packages/*"],
    env: {
      TZ: "Z",
    },
  },
});
