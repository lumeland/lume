import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import gitInfo from "../plugins/git_info.ts";

Deno.test("git_info plugin", async (t) => {
  const site = getSite({
    src: "git_info",
  });

  site.use(gitInfo());

  await build(site);
  await assertSiteSnapshot(t, site);
});
