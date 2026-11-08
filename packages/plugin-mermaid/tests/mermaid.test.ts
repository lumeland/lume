import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import { mermaid } from "../src/mod.ts";

describe("mermaid plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(mermaid());

    expect(await build(site)).toMatchSnapshot();
  });
});
