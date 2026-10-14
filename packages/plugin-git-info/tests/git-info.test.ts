import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import gitInfo from "../src/mod.ts";

describe("git-info plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(gitInfo());

    expect(await build(site)).toMatchSnapshot();
  });
});
