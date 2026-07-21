import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import lightningcss from "../plugins/lightningcss.ts";

import type { PaginatePluginData } from "../plugins/paginate.ts";
import type { SearchPluginData } from "../plugins/search.ts";
import type { SourceMapsPluginData } from "../plugins/source_maps.ts";

interface TestData
  extends
    SourceMapsPluginData,
    PaginatePluginData,
    SearchPluginData<TestData> {}

Deno.test("Lightningcss plugin (transform)", async (t) => {
  const site = getSite<TestData>({
    src: "lightningcss",
  });

  site.add("index.css");
  site.add("text.css");
  site.use(lightningcss({
    includes: false,
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("Lightningcss plugin (bundle)", async (t) => {
  const site = getSite<TestData>({
    src: "lightningcss",
  });

  site.add([".css"]);
  site.use(lightningcss());

  await build(site);
  await assertSiteSnapshot(t, site);
});
