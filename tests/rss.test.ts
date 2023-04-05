import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import rss from "../plugins/rss.ts";

Deno.test("RSS plugin", async (t) => {
  const site = getSite({
    src: "normal",
    location: new URL("https://example.com/"),
    server: {
      page404: "/page5/",
    },
  });

  site.use(
    rss({
      buildDate: new Date("2020-01-01"),
    })
  );
  site.ignore("static.yml");

  // build page
  await build(site);

  // compare to snapshot
  await assertSiteSnapshot(t, site);
});
