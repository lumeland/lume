import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import nav, { NavPluginData } from "../plugins/nav.ts";
import { PaginatePluginData } from "../plugins/paginate.ts";
import { SearchPluginData } from "../plugins/search.ts";

interface TestData
  extends
    NavPluginData<TestData>,
    PaginatePluginData,
    SearchPluginData<TestData> {}

Deno.test("nav plugin", async (t) => {
  const site = getSite<TestData>({
    src: "nav",
  });

  site.use(nav({ order: "order basename" }));

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("nav plugin with pretty urls disabled", async (t) => {
  const site = getSite<TestData>({
    src: "nav",
    prettyUrls: false,
  });

  site.use(nav({ order: "order basename" }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
