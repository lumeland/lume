import { assertEquals } from "../deps/assert.ts";
import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import fff from "../plugins/fff.ts";
import { Page } from "../core/file.ts";

import type { PaginatePluginData } from "../plugins/paginate.ts";
import type { SearchPluginData } from "../plugins/search.ts";
import type { FFFPluginData } from "../plugins/fff.ts";

interface TestData
  extends FFFPluginData, PaginatePluginData, SearchPluginData<TestData> {}

Deno.test("FFF plugin", async (t) => {
  const site = getSite<TestData>({
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
    getGitDate: true,
    postTypeDiscovery: true,
  }));

  // build page
  await build(site);

  // compare to snapshot
  await assertSiteSnapshot(t, site);

  const { pages } = site;

  // published => date
  const date = pages.find((page) => page.src.path === "/date")!;
  assertEquals(date.data.date, date.data.published);
  // getGitDate
  assertEquals(!!date.data.created, true);
  assertEquals(!!date.data.updated, true);
  // postTypeDiscovery
  assertEquals(date.data.type, "article");

  // images (string media) => image (object media)
  // deno-lint-ignore no-explicit-any
  const image = pages.find((page) => page.src.path === "/image") as Page<any>;
  assertEquals(image.data.image.alt, "FFF Image Test");
  assertEquals(image.data.image.src, "/my-image.png");
  // getGitDate
  assertEquals(!!image.data.created, true);
  assertEquals(!!image.data.updated, true);
  // postTypeDiscovery
  assertEquals(image.data.type, "photo");

  // categories => tags
  const tags = pages.find((page) => page.src.path === "/tags")!;
  assertEquals(tags.data.tags, ["foo", "bar", "baz", "qux"]);
  // getGitDate
  assertEquals(!!tags.data.created, true);
  assertEquals(!!tags.data.updated, true);
  // postTypeDiscovery (todo: fix this)
  // assertEquals(tags.data.type, "note");
});
