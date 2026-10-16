import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import esbuild from "../src/mod.ts";

describe("esbuild plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.add([".ts"]);

    // Test ignore with a function filter
    site.ignore((path) => path === "/modules" || path.startsWith("/modules/"));
    site.use(esbuild());

    expect(await build(site)).toMatchSnapshot();
  });

  it("should match with out extension", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.add([".ts"]);

    // Test ignore with a function filter
    site.ignore((path) => path === "/modules" || path.startsWith("/modules/"));
    site.use(
      esbuild({
        options: {
          outExtension: { ".js": ".min.js" },
        },
      }),
    );

    expect(await build(site)).toMatchSnapshot();
  });

  it("should match with entryNames", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.add([".ts"]);

    // Test ignore with a function filter
    site.ignore((path) => path === "/modules" || path.startsWith("/modules/"));
    site.use(
      esbuild({
        options: {
          entryNames: "js/[name].hash",
        },
      }),
    );

    expect(await build(site)).toMatchSnapshot();
  });

  it("should match with complex entryNames", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.add([".ts"]);

    // Test ignore with a function filter
    site.ignore((path) => path === "/modules" || path.startsWith("/modules/"));
    site.use(
      esbuild({
        options: {
          entryNames: "one/[dir]/two/[name]/hash",
        },
      }),
    );

    expect(await build(site)).toMatchSnapshot();
  });

  it("should match without bundle", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.add([".ts"]);

    // Test ignore with a function filter
    site.use(
      esbuild({
        options: {
          bundle: false,
          entryNames: "[dir]/[name].hash",
          outExtension: { ".js": ".min.js" },
        },
      }),
    );

    expect(await build(site)).toMatchSnapshot();
  });
});
