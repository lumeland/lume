import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import netlifyCMS from "../plugins/netlify_cms.ts";

Deno.test("code_hightlight plugin", async (t) => {
  const site = getSite({
    src: "netlify_cms",
    location: new URL("https://example.com"),
  });

  site.use(netlifyCMS({
    local: false,
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
