import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import epub, { EpubPluginData } from "../plugins/epub.ts";
import { Data } from "../core/file.ts";
import { PaginatePluginData } from "../plugins/paginate.ts";
import { SearchPluginData } from "../plugins/search.ts";

interface TestData
  extends
    Data,
    EpubPluginData<TestData>,
    PaginatePluginData,
    SearchPluginData<TestData> {}

Deno.test(
  "epub plugin",
  { sanitizeOps: false, sanitizeResources: false },
  async (t) => {
    const site = getSite<TestData>({
      src: "epub",
    });

    site.use(epub({
      outputUncompressed: true,
      metadata: {
        date: new Date("2026-01-08T19:00:00"),
      },
    }));

    await build(site);
    await assertSiteSnapshot(t, site);
  },
);
