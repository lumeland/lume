import { assertStrictEquals as equals } from "../../../deps/assert.ts";
import { getDataValue } from "../../../core/utils/data_values.ts";
import { build, getSite } from "../../utils.ts";
import metas from "../../../plugins/metas.ts";

import type { PaginatePluginData } from "../../../plugins/paginate.ts";
import type { SearchPluginData } from "../../../plugins/search.ts";
import type { MetasPluginData } from "../../../plugins/metas.ts";

interface TestData
  extends
    MetasPluginData<TestData>,
    PaginatePluginData,
    SearchPluginData<TestData> {}

Deno.test("Test getDataValue() function", async (t) => {
  const site = getSite<TestData>({ src: "metas" });

  site.use(metas());
  site.process([".html"], async (pages) => {
    for (const page of pages) {
      // deno-lint-ignore no-explicit-any
      const { data } = page as any;
      if (!data.cover) continue;

      await t.step(
        "Data query: =",
        () =>
          equals(
            getDataValue(data, data.metas.image),
            data.cover,
          ),
      );

      await t.step(
        "CSS query: $",
        () =>
          equals(
            getDataValue(data, '$meta[property="og:image"] attr(content)'),
            new URL(site.url(data.cover), site.url(page.data.url, true)).href,
          ),
      );
    }
  });

  await build(site);
});
