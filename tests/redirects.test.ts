import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import redirects from "../plugins/redirects.ts";
import type { RedirectPluginData } from "../plugins/redirects.ts";
import type { PaginatePluginData } from "../plugins/paginate.ts";
import type { SearchPluginData } from "../plugins/search.ts";

interface TestData
  extends RedirectPluginData, PaginatePluginData, SearchPluginData<TestData> {}

Deno.test("redirects plugin", async (t) => {
  const site = getSite<TestData>({
    src: "redirects",
  });

  site.use(redirects());

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("redirects plugin for netlify", async (t) => {
  const site = getSite<TestData>({
    src: "redirects",
  });

  site.use(redirects({
    output: "netlify",
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("redirects plugin for vercel", async (t) => {
  const site = getSite<TestData>({
    src: "redirects",
  });

  site.use(redirects({
    output: "vercel",
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("redirects plugin for json", async (t) => {
  const site = getSite<TestData>({
    src: "redirects",
  });

  site.use(redirects({
    output: "json",
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
