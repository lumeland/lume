import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import redirects from "../src/mod.ts";

describe("redirects plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(redirects());

    expect(await build(site)).toMatchSnapshot();
  });

  it("should match site snapshot for netlify", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(redirects({ output: "netlify" }));

    expect(await build(site)).toMatchSnapshot();
  });

  it("should match site snapshot for vercel", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(redirects({ output: "vercel" }));

    expect(await build(site)).toMatchSnapshot();
  });

  it("should match site snapshot for json", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(redirects({ output: "json" }));

    expect(await build(site)).toMatchSnapshot();
  });
});
