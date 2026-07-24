import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import sass from "../plugins/sass.ts";

import type { PaginatePluginData } from "../plugins/paginate.ts";
import type { SearchPluginData } from "../plugins/search.ts";
import type { SourceMapsPluginData } from "../plugins/source_maps.ts";

interface TestData
  extends
    SourceMapsPluginData,
    PaginatePluginData,
    SearchPluginData<TestData> {}

Deno.test("SASS plugin", async (t) => {
  const site = getSite<TestData>({
    src: "sass",
  });
  site.add([".scss", ".sass"]);
  site.use(sass());

  await build(site);
  await assertSiteSnapshot(t, site);
});
