import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import transformImages from "../plugins/transform_images.ts";
import picture from "../plugins/picture.ts";

import type { PaginatePluginData } from "../plugins/paginate.ts";
import type { SearchPluginData } from "../plugins/search.ts";
import type { PicturePluginData } from "../plugins/picture.ts";

interface TestData
  extends PicturePluginData, PaginatePluginData, SearchPluginData<TestData> {}

Deno.test("picture plugin", async (t) => {
  const site = getSite<TestData>({
    src: "picture",
  });

  site.use(picture());
  site.use(transformImages());

  await build(site);
  await assertSiteSnapshot(t, site, {
    avoidBinaryFilesLength: true,
  });
});
