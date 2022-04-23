import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import eta from "../plugins/eta.ts";

Deno.test("build a site with eta", async (t) => {
  const site = getSite({
    src: "eta",
    location: new URL("https://example.com/blog"),
  });

  site.use(eta());

  await build(site);
  await assertSiteSnapshot(t, site);
});
