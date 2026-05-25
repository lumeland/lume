import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import icons from "../plugins/icons.ts";

Deno.test("icons plugin", async (t) => {
  const site = getSite({
    src: "icons",
  });

  site.use(icons());

  await build(site);
  await assertSiteSnapshot(t, site);
});
