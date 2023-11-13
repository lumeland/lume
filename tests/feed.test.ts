import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import feed from "../plugins/feed.ts";

Deno.test("RSS plugin", async (t) => {
  const site = getSite({
    src: "normal",
    location: new URL("https://example.com/"),
  });

  site.use(
    feed({
      output: ["feed.json", "feed.rss"],
      info: {
        published: new Date("2020-01-01"),
        generator: "https://lume.land",
      },
      items: {
        updated: "=date",
      },
    }),
  );
  site.ignore("static.yml");

  // build page
  await build(site);

  // compare to snapshot
  await assertSiteSnapshot(t, site);
});
