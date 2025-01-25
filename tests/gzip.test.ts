import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import gzip from "../plugins/gzip.ts";
import unocss from "../plugins/unocss.ts";

Deno.test("gzip plugin", async (t) => {
  const site = getSite({
    src: "normal",
  });

  site.add([".png", ".css", ".json"]);

  site.use(gzip());

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("gzip plugin with options", async (t) => {
  const site = getSite({
    src: "unocss",
  });

  site.use(unocss({
    cssFile: "styles.css",
  }));
  site.use(gzip({
    extensions: [".css"],
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
