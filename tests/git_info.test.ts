import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import gitInfo from "../plugins/git_info.ts";
import type { GitInfoPluginData } from "../plugins/git_info.ts";
import type { PaginatePluginData } from "../plugins/paginate.ts";
import type { SearchPluginData } from "../plugins/search.ts";

interface TestData
  extends GitInfoPluginData, PaginatePluginData, SearchPluginData<TestData> {}

Deno.test("git_info plugin", async (t) => {
  const site = getSite<TestData>({
    src: "git_info",
  });

  site.use(gitInfo());

  await build(site);
  await assertSiteSnapshot(t, site);
});
