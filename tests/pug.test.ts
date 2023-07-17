import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import pug from "../plugins/pug.ts";

Deno.test("build a site with pug", async (t) => {
  const site = getSite({
    src: "pug",
    location: new URL("https://example.com/blog"),
  });

  site.use(pug());

  await build(site);
  await assertSiteSnapshot(t, site);
});
