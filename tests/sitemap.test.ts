import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import sitemap from "../plugins/sitemap.ts";

Deno.test("Sitemap plugin", async (t) => {
  const site = getSite({
    src: "normal",
    location: new URL("https://example.com/"),
    server: {
      page404: "/page5/",
    },
  });

  site.use(sitemap());
  site.ignore("static.yml");

  await build(site);
  await assertSiteSnapshot(t, site);
});
