import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import svgo from "../plugins/svgo.ts";
import favicon from "../plugins/favicon.ts";

Deno.test("favicon plugin", async (t) => {
  const site = getSite({
    src: "favicon",
  });

  site.use(svgo());
  site.use(favicon());

  await build(site);
  await assertSiteSnapshot(t, site);
});
