import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import gitDate from "../src/mod.ts";

describe("git-date plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(gitDate());

    expect(await build(site)).toMatchSnapshot();
  });

  it("should match store the data in a different variable", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(
      gitDate({
        varName: "other",
      }),
    );

    expect(await build(site)).toMatchSnapshot();
  });
});
