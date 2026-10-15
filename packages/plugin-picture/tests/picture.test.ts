import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import transformImages from "@lumeland/plugin-transform-images";
import picture from "../src/mod.ts";

describe("picture plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(picture());
    site.use(transformImages());

    expect(await build(site, { avoidBinaryFilesLength: true })).toMatchSnapshot();
  });
});
