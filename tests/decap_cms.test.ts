import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import decapCMS from "../plugins/decap_cms.ts";

Deno.test("Decap CMS plugin", async (t) => {
  const site = getSite({
    src: "decap_cms",
    location: new URL("https://example.com"),
  });

  site.use(decapCMS({
    local: false,
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
