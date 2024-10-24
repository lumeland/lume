import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import brotli from "../plugins/brotli.ts";

Deno.test("brotli plugin", async (t) => {
  const site = getSite({
    src: "normal",
  });

  site.loadAssets([".css", ".json"]);
  site.copy([".png"]);

  site.use(brotli());

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("brotli plugin with options", async (t) => {
  const site = getSite({
    src: "normal",
  });

  site.loadAssets([".css", ".json"]);
  site.copy([".png"]);

  site.use(brotli({
    extensions: [".css"],
    quality: 1,
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
