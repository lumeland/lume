import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import plaintext from "../src/mod.ts";

describe("plaintext plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(plaintext());

    expect(await build(site)).toMatchSnapshot();
  });
});
