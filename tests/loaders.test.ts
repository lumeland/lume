import { assert, assertEquals, assertStrictEquals } from "../deps/assert.ts";

import textLoader from "../core/loaders/text.ts";
import { assertSiteSnapshot, build, getPage, getSite } from "./utils.ts";

Deno.test("Load the pages of a site", async (t) => {
  Deno.env.set("LUME_DRAFTS", "true");
  const site = getSite({
    src: "normal",
  });

  site.add([".png", ".css"]);
  site.add("static.yml");
  site.data("tags", "pages");
  site.data("tags", "sub-pages", "/pages");
  site.data("title", "Page 7", "/pages/subpage/page7.page.js");

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
  Deno.env.set("LUME_DRAFTS", "false");
  const site = getSite({
    src: "normal",
  });

  // This file is loaded even if it's copied because it's a known extension
  site.add("static.yml");

  await build(site);

  assertStrictEquals(site.pages.length, 8);
});

Deno.test("textLoader with frontmatter containing just a comment", async () => {
  assertEquals(
    await textLoader(
      import.meta.resolve("./assets/frontmatter-only-comment.md"),
    ),
    { content: "" },
  );
});
