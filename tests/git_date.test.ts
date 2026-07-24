import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import gitDate from "../plugins/git_date.ts";
import type { GitDatePluginData } from "../plugins/git_date.ts";
import type { PaginatePluginData } from "../plugins/paginate.ts";
import type { SearchPluginData } from "../plugins/search.ts";

type TestData<DateKey extends string = "date"> =
  & GitDatePluginData<DateKey>
  & PaginatePluginData
  & SearchPluginData<TestData<DateKey>>;

Deno.test("git_date plugin", async (t) => {
  const site = getSite<TestData>({
    src: "git_date",
  });

  site.use(gitDate());

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("git_date plugin (varName)", async (t) => {
  const site = getSite<TestData<"other">>({
    src: "git_date",
  });

  site.use(gitDate({
    varName: "other",
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
