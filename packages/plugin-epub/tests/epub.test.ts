import { describe, expect, it } from "vitest";
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
          date: new Date(Date.UTC(2026, 0, 8, 18, 0, 0)),
        },
      }),
    );

    expect(await build(site, { avoidBinaryFilesLength: true })).toMatchSnapshot();
  });
});
