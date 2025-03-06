import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import gzip from "../plugins/gzip.ts";
import unocss from "../plugins/unocss.ts";
import extractDate from "../plugins/extract_date.ts";

Deno.test("gzip plugin", async (t) => {
  const site = getSite({
    src: "normal",
  });

  site.add([".png", ".css", ".json"]);

  site.use(gzip());
  site.use(extractDate());

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("gzip plugin with options", async (t) => {
  const site = getSite({
    src: "unocss",
  });

  site.add([".css"]);
  site.use(unocss({
    cssFile: "styles.css",
  }));
  site.use(gzip({
    extensions: [".css"],
  }));
  site.use(extractDate());

  await build(site);
  await assertSiteSnapshot(t, site);
});
