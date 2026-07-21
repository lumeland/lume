import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import terser from "../plugins/terser.ts";

import type { PaginatePluginData } from "../plugins/paginate.ts";
import type { SearchPluginData } from "../plugins/search.ts";
import type { SourceMapsPluginData } from "../plugins/source_maps.ts";

interface TestData
  extends
    SourceMapsPluginData,
    PaginatePluginData,
    SearchPluginData<TestData> {}

Deno.test("terser plugin", async (t) => {
  const site = getSite<TestData>({
    src: "terser",
  });

  site.add([".js"]);
  site.use(terser());

  await build(site);
  await assertSiteSnapshot(t, site);
});
