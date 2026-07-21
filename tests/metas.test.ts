import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import metas from "../plugins/metas.ts";

import type { Page } from "../core/file.ts";

import type { PaginatePluginData } from "../plugins/paginate.ts";
import type { SearchPluginData } from "../plugins/search.ts";
import type { MetasPluginData } from "../plugins/metas.ts";

interface TestData
  extends
    MetasPluginData<TestData>,
    PaginatePluginData,
    SearchPluginData<TestData> {}

Deno.test("metas plugin", async (t) => {
  const site = getSite<TestData>({
    src: "metas",
  });

  site.use(metas());
  site.preprocess([".md"], (pages: Page[]) => {
    pages.forEach((page) => {
      page.data.excerpt ??=
        (page.data.content as string).split("<!--more-->")[0];
    });
  });

  await build(site);
  await assertSiteSnapshot(t, site);
});
