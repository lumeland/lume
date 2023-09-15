import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import favicon from "../plugins/favicon.ts";

Deno.test("favicon plugin", async (t) => {
  const site = getSite({
    src: "favicon",
  });

  site.use(favicon({
    cache: false,
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
