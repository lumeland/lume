import { assertEquals } from "../deps/assert.ts";
import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import fff from "../plugins/fff.ts";

Deno.test("FFF plugin", async (t) => {
  const site = getSite({
    src: "normal",
    location: new URL("https://example.com/"),
  });

  site.use(fff({
    presets: [{
      published: "date",
      summary: "content",
    }],
  }));
  site.ignore("static.yml");

  // build page
  await build(site);

  // compare to snapshot
  await assertSiteSnapshot(t, site);

  const { pages } = site;

  const page5 = pages.find(page => page.src.path === "/page5")!

  assertEquals(page5.data.date, page5.data.published)
  assertEquals(page5.data.content, page5.data.summary)
});
