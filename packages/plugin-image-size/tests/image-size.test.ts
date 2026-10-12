import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import imageSize from "../src/mod.ts";

describe("image-size plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.add("/");
    site.use(imageSize());
    site.remoteFile("/logo.png", "https://lume.land/logo.png");

    expect(await build(site)).toMatchSnapshot();
  });
});
