import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import pwa from "../plugins/pwa.ts";

Deno.test("PWA plugin", async (t) => {
  const site = getSite({
    src: "pwa",
  });

  site.use(pwa());

  await build(site);
  await assertSiteSnapshot(t, site);
});
