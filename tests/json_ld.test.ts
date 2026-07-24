import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import jsonLd from "../plugins/json_ld.ts";

import type { PaginatePluginData } from "../plugins/paginate.ts";
import type { SearchPluginData } from "../plugins/search.ts";
import type { JsonldPluginData } from "../plugins/json_ld.ts";

interface TestData
  extends JsonldPluginData, PaginatePluginData, SearchPluginData<TestData> {}

Deno.test("json_ld plugin", async (t) => {
  const site = getSite<TestData>({
    src: "json_ld",
  });

  site.use(jsonLd());

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("json_ld plugin (no insert)", async (t) => {
  const site = getSite<TestData>({
    src: "json_ld",
  });

  site.use(jsonLd({ insert: false }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
