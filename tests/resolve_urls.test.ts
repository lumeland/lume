import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import resolveUrls from "../plugins/resolve_urls.ts";
import slugifyUrls from "../plugins/slugify_urls.ts";

import type { PaginatePluginData } from "../plugins/paginate.ts";
import type { SearchPluginData } from "../plugins/search.ts";
import type { SlugifyUrlsPluginData } from "../plugins/slugify_urls.ts";

interface TestData
  extends
    SlugifyUrlsPluginData,
    PaginatePluginData,
    SearchPluginData<TestData> {}

Deno.test("relative_url plugin", async (t) => {
  const site = getSite<TestData>({
    src: "resolve_urls",
  });

  site.add("statics", "");
  site.use(resolveUrls());
  site.use(slugifyUrls()); // Test combined with slugify_urls

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("relative_url plugin (without slugify)", async (t) => {
  const site = getSite({
    src: "resolve_urls",
  });

  site.add("statics", "");
  site.use(resolveUrls());

  await build(site);
  await assertSiteSnapshot(t, site);
});
