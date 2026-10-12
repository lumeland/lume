import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import extractDate from "@lumeland/plugin-extract-date";
import compress from "../src/mod.ts";

describe("compress plugin", async () => {
  it("brotli should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.add([".png", ".css", ".json"]);
    site.use(
      compress({
        format: "brotli",
      }),
    );
    site.use(extractDate());

    expect(await build(site)).toMatchSnapshot();
  });

  it("gzip should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.add([".png", ".css", ".json"]);
    site.use(
      compress({
        format: "gzip",
      }),
    );
    site.use(extractDate());

    expect(await build(site)).toMatchSnapshot();
  });
});
