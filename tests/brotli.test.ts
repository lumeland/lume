import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import brotli from "../plugins/brotli.ts";
import extractDate from "../plugins/extract_date.ts";

Deno.test("brotli plugin", async (t) => {
  const site = getSite({
    src: "normal",
  });

  site.add([".png", ".css", ".json"]);

  site.use(brotli());
  site.use(extractDate());

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("brotli plugin with options", async (t) => {
  const site = getSite({
    src: "normal",
  });

  site.add([".png", ".css", ".json"]);

  site.use(brotli({
    extensions: [".css"],
    quality: 1,
  }));
  site.use(extractDate());

  await build(site);
  await assertSiteSnapshot(t, site);
});
