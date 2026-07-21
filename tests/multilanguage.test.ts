import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import multilanguage from "../plugins/multilanguage.ts";

import type { PaginatePluginData } from "../plugins/paginate.ts";
import type { SearchPluginData } from "../plugins/search.ts";
import type { MultilanguagePluginData } from "../plugins/multilanguage.ts";

interface TestData
  extends
    MultilanguagePluginData,
    PaginatePluginData,
    SearchPluginData<TestData> {}

Deno.test("multilanguage plugin", async (t) => {
  const site = getSite<TestData>({
    src: "multilanguage",
  });

  site.use(multilanguage({
    defaultLanguage: "gl",
    languages: ["en", "fr", "it", "gl"],
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
