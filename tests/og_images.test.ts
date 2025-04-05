import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import ogImages from "../plugins/og_images.ts";

Deno.test("OpenGraph images", async (t) => {
  const site = getSite({
    src: "og_images",
  });

  site.use(ogImages());

  await build(site);
  await assertSiteSnapshot(t, site);
});
