import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import minifyHtml from "../plugins/minify_html.ts";

Deno.test("minify_html plugin", async (t) => {
  const site = getSite({
    src: "minify_html",
  });

  site.use(minifyHtml());

  await build(site);
  await assertSiteSnapshot(t, site);
});
