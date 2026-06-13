import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import readingInfo, { ReadingInfoPluginData } from "../plugins/reading_info.ts";
import { Data } from "../core/file.ts";
import { PaginatePluginData } from "../plugins/paginate.ts";
import { SearchPluginData } from "../plugins/search.ts";

interface TestData
  extends
    Data,
    ReadingInfoPluginData,
    PaginatePluginData,
    SearchPluginData<TestData> {}

Deno.test("Reading info plugin", async (t) => {
  const site = getSite<TestData>({
    src: "reading_info",
  });

  site.use(readingInfo());

  await build(site);
  await assertSiteSnapshot(t, site);
});
