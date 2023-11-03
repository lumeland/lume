import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import nunjucks from "../plugins/nunjucks.ts";

Deno.test("follow symlinks", async (t) => {
  const site = getSite({
    src: "symlinks/src",
  });

  site.use(nunjucks());

  await build(site);
  await assertSiteSnapshot(t, site);
});
