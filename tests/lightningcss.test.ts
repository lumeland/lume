import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import lightningcss from "../plugins/lightningcss.ts";

Deno.test("Lightningcss plugin (transform)", async (t) => {
  const site = getSite({
    src: "lightningcss",
  });

  site.add("index.css");
  site.add("text.css");
  site.use(lightningcss({
    includes: false,
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("Lightningcss plugin (bundle)", async (t) => {
  const site = getSite({
    src: "lightningcss",
  });

  site.add([".css"]);
  site.use(lightningcss());

  await build(site);
  await assertSiteSnapshot(t, site);
});
