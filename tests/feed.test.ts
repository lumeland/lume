import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import feed from "../plugins/feed.ts";

Deno.test("RSS plugin", async (t) => {
  const site = getSite({
    src: "feed",
    location: new URL("https://example.com/"),
  });

  site.use(
    feed({
      output: ["feed.json", "feed.rss"],
      info: {
        published: new Date("2020-01-01"),
        generator: "https://lume.land",
        authorName: "Laura Rubio",
        icon: "https://example.com/icon.svg",
        image: "https://example.com/image.png",
        color: "#ff0000",
      },
      items: {
        title: (data) => data.title?.toUpperCase(),
        updated: "=date || $.date",
        published: "$.not-found || =published",
        authorName: "=author.name",
        authorUrl: "=author.url",
      },
    }),
  );
  site.ignore("static.yml");

  // build page
  await build(site);

  // compare to snapshot
  await assertSiteSnapshot(t, site);
});
