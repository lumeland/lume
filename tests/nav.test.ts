import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import nav from "../plugins/nav.ts";

Deno.test("nav plugin", async (t) => {
  const site = getSite({
    src: "nav",
  });

  site.use(nav());

  await build(site);
  await assertSiteSnapshot(t, site);
});
