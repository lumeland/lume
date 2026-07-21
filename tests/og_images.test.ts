import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import ogImages from "../plugins/og_images.ts";

import type { PaginatePluginData } from "../plugins/paginate.ts";
import type { SearchPluginData } from "../plugins/search.ts";
import type { OgImagesPluginData } from "../plugins/og_images.ts";

interface TestData
  extends
    OgImagesPluginData<TestData>,
    PaginatePluginData,
    SearchPluginData<TestData> {}

Deno.test("OpenGraph images", async (t) => {
  const site = getSite<TestData>({
    src: "og_images",
  });

  site.use(ogImages());

  await build(site);
  await assertSiteSnapshot(t, site);
});
