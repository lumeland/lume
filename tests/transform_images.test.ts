import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import imageTransform from "../plugins/transform_images.ts";
import type { PaginatePluginData } from "../plugins/paginate.ts";
import type { SearchPluginData } from "../plugins/search.ts";

import type { TransformImagesPluginData } from "../plugins/transform_images.ts";

interface TestData
  extends
    TransformImagesPluginData,
    PaginatePluginData,
    SearchPluginData<TestData> {}

Deno.test("Image transform plugin", async (t) => {
  const site = getSite<TestData>({
    src: "transform_images",
  });

  site.add("/");
  site.use(imageTransform());

  await build(site);
  await assertSiteSnapshot(t, site);
});
