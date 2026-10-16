import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import epub from "../src/mod.ts";

describe("epub plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(
      epub({
        outputUncompressed: true,
        metadata: {
          date: new Date("2026-01-08T19:00:00"),
        },
      }),
    );

    expect(await build(site)).toMatchSnapshot();
  });
});
