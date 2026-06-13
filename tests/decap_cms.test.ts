import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import decapCMS, { DecapCmsPluginData } from "../plugins/decap_cms.ts";
import { Data } from "../core/file.ts";
import { PaginatePluginData } from "../plugins/paginate.ts";
import { SearchPluginData } from "../plugins/search.ts";

interface TestData extends Data, DecapCmsPluginData, PaginatePluginData, SearchPluginData<TestData> {}

Deno.test("Decap CMS plugin", async (t) => {
  const site = getSite<TestData>({
    src: "decap_cms",
    location: new URL("https://example.com"),
  });

  site.use(decapCMS({
    local: false,
    identity: "netlify",
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
