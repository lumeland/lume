import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import partytown from "../src/mod.ts";

describe("partytown plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(partytown());

    expect(await build(site)).toMatchSnapshot();
  });
  it("should match debug mode", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(
      partytown({
        options: {
          debug: true,
        },
      }),
    );

    expect(await build(site)).toMatchSnapshot();
  });
});
