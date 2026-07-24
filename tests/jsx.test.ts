import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import jsx, { JSXPluginData } from "../plugins/jsx.ts";
import { PaginatePluginData } from "../plugins/paginate.ts";
import { SearchPluginData } from "../plugins/search.ts";

interface TestData
  extends JSXPluginData, PaginatePluginData, SearchPluginData<TestData> {}

Deno.test("build a site with jsx/tsx modules", async (t) => {
  const site = getSite<TestData>({
    src: "jsx",
    location: new URL("https://example.com/blog"),
  });

  site.use(jsx());

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("Previous preact test with SSX", async (t) => {
  const site = getSite<TestData>({
    src: "jsx_preact",
    location: new URL("https://example.com/blog"),
  });

  site.use(jsx());

  await build(site);
  await assertSiteSnapshot(t, site);
});
