import { assertEquals } from "../deps/assert.ts";
import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import fff from "../plugins/fff.ts";

Deno.test("FFF plugin", async (t) => {
  const site = getSite({
    src: "fff",
    location: new URL("https://example.com/"),
  });

  site.use(fff({
    date: "published",
    presets: [{
      summary: "content",
    }],
    strict: {
      categories: false,
      media: {
        array: false,
        type: "object",
      },
    },
  }));

  // build page
  await build(site);

  // compare to snapshot
  await assertSiteSnapshot(t, site);

  const { pages } = site;

  // published => date
  const date = pages.find((page) => page.src.path === "/date")!;
  assertEquals(date.data.date, date.data.published);

  // images (string media) => image (object media)
  const image = pages.find((page) => page.src.path === "/image")!;
  assertEquals(image.data.image.alt, "FFF Image Test");
  assertEquals(image.data.image.src, "/my-image.png");

  // categories => tags
  const tags = pages.find((page) => page.src.path === "/tags")!;
  assertEquals(tags.data.tags, ["foo", "bar", "baz", "qux"]);
});
