import { assert, assertEquals, assertStrictEquals } from "../deps/assert.ts";
import binaryLoader from "../core/loaders/binary.ts";
import textLoader from "../core/loaders/text.ts";
import { assertSiteSnapshot, build, getPage, getSite } from "./utils.ts";

Deno.test("Load the pages of a site", async (t) => {
  const site = getSite({
    dev: true,
    src: "normal",
  });

  site.loadAssets([".png"], binaryLoader);
  site.copy("static.yml");
  site.loadAssets([".css"]);
  site.data("tags", "pages");
  site.data("tags", "sub-pages", "/pages");
  site.data("title", "Page 7", "/pages/subpage/page7.tmpl.js");

  await build(site);
  await assertSiteSnapshot(t, site);

  // Shared data
  const page1 = getPage(site, "/pages/page1");
  const page2 = getPage(site, "/pages/2020-06-21_page2");

  assert(page1.data.colors === page2.data.colors);
  assert(page1.data.documents === page2.data.documents);
  assert(page1.data.drinks === page2.data.drinks);
  assert(page1.data.names === page2.data.names);
});

Deno.test("ignored draft pages on dev=false", async () => {
  const site = getSite({
    dev: false,
    src: "normal",
  });

  site.copy("static.yml");

  await build(site);

  assertStrictEquals(site.pages.length, 6);
});

Deno.test("textLoader with frontmatter containing just a comment", async () => {
  assertEquals(
    await textLoader(
      import.meta.resolve("./assets/frontmatter-only-comment.md"),
    ),
    { content: "" },
  );
});
