import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import gitDate from "../plugins/git_date.ts";

Deno.test("git_date plugin", async (t) => {
  const site = getSite({
    src: "git_date",
  });

  site.use(gitDate());

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("git_date plugin (override)", async (t) => {
  const site = getSite({
    src: "git_date",
  });

  site.use(gitDate({
    override: true,
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
