import { build, getSite } from "./utils.ts";
import seo from "../plugins/seo.ts";

import type { PaginatePluginData } from "../plugins/paginate.ts";
import type { SearchPluginData } from "../plugins/search.ts";
import type { SEOPluginData } from "../plugins/seo.ts";

interface TestData
  extends SEOPluginData, PaginatePluginData, SearchPluginData<TestData> {}

Deno.test("SEO plugin", async (t) => {
  const site = getSite<TestData>({
    src: "seo",
  });

  const result: { url: string; messages: string[] }[] = [];

  site.use(seo({
    output(reports) {
      for (const [url, messages] of reports.entries()) {
        result.push({
          url,
          messages: messages.map((msg) =>
            typeof msg === "string" ? msg : msg.msg
          ),
        });
      }
    },
  }));

  await build(site);
  result.sort((a, b) => a.url.localeCompare(b.url));
  await t.assertSnapshot(result);
});
