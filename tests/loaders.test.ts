import { assert, assertStrictEquals as equals } from "../deps/assert.ts";
import binaryLoader from "../core/loaders/binary.ts";
import { getPage, getSite, testPage } from "./utils.ts";

Deno.test("load the pages of a site", async () => {
  const site = getSite({
    dev: true,
    src: "normal",
  });

  site.loadAssets([".png"], binaryLoader);
  site.copy("static.yml");
  site.loadAssets([".css"]);

  await site.build();

  // Test the generated pages
  equals(site.pages.length, 8);

  // The data is merged
  testPage(site, "/pages/1_page1", (page) => {
    const metas = page.data.metas as Record<string, unknown>;
    const imagick = page.data.imagick as Record<string, unknown>;

    assert(page.data.draft);
    equals(page.data.url, "/pages/page1/");
    equals(page.data.title, "Page 1");
    equals(page.data.tags?.length, 3);
    equals(page.data.tags?.[0], "pages");
    equals(page.data.tags?.[1], "sub-pages");
    equals(page.data.tags?.[2], "page1");
    equals(metas.title, "Custom title");
    equals(metas.description, "Default description");
    equals(imagick.length, 2);
    equals(page.data.site, "Folder overrided site name");
    equals(page.dest.path, "/pages/page1/index");
    equals(page.dest.ext, ".html");
    equals(page.data.date?.getTime(), 1);

    // Shared data
    // @ts-ignore: unknown property
    equals(page.data.colors.length, 3);
    // @ts-ignore: unknown property
    equals(page.data.documents.length, 3);
    // @ts-ignore: unknown property
    equals(page.data.drinks.alcoholic.length, 2);
    // @ts-ignore: unknown property
    equals(page.data.names.length, 2);
  });

  testPage(site, "/pages/2020-06-21_page2", (page) => {
    assert(!page.data.draft);
    equals(page.data.url, "/overrided-page2/");
    equals(page.data.title, "Page 2");
    equals(page.data.tags?.length, 2);
    equals(page.data.tags?.[0], "pages");
    equals(page.data.tags?.[1], "sub-pages");
    equals(page.data.site, "Folder overrided site name");
    equals(page.dest.path, "/overrided-page2/index");
    equals(page.dest.ext, ".html");
    equals(
      page.data.date?.getTime(),
      new Date(Date.UTC(2020, 5, 21)).getTime(),
    );
  });

  // Shared data
  const page1 = getPage(site, "/pages/1_page1");
  const page2 = getPage(site, "/pages/2020-06-21_page2");

  // @ts-ignore: unknown property
  assert(page1.data.colors === page2.data.colors);
  // @ts-ignore: unknown property
  assert(page1.data.documents === page2.data.documents);
  // @ts-ignore: unknown property
  assert(page1.data.drinks === page2.data.drinks);
  // @ts-ignore: unknown property
  assert(page1.data.names === page2.data.names);

  testPage(site, "/pages/page3", (page) => {
    assert(!page.data.draft);
    equals(page.data.url, "/page_3");
    equals(page.data.title, "Page 3");
    equals(page.data.tags?.length, 2);
    equals(page.data.tags?.[0], "pages");
    equals(page.data.tags?.[1], "sub-pages");
    equals(page.data.site, "Folder overrided site name");
    equals(page.dest.path, "/page_3");
    equals(page.dest.ext, "");
    equals(page.data.date?.getTime(), new Date(2020, 0, 1).getTime());
  });

  testPage(site, "/pages/2021-01-02-18-32_page4", (page) => {
    assert(!page.data.draft);
    equals(page.data.url, "/pages/page4/");
    equals(page.data.title, "Page 4");
    equals(page.data.tags?.length, 2);
    equals(page.data.tags?.[0], "pages");
    equals(page.data.tags?.[1], "sub-pages");
    equals(page.data.site, "Overrided site name");
    equals(page.dest.path, "/pages/page4/index");
    equals(page.dest.ext, ".html");
    equals(
      page.data.date?.getTime(),
      new Date(Date.UTC(2021, 0, 2, 18, 32)).getTime(),
    );
  });

  testPage(site, "/page5", (page) => {
    assert(!page.data.colors);
    assert(!page.data.documents);
    assert(!page.data.draft);
    equals(page.data.url, "/page5/");
    equals(page.data.title, "Page 5");
    equals(page.data.tags?.length, 1);
    equals(page.data.tags?.[0], "pages");
    equals(page.data.site, "Default site name");
    equals(page.dest.path, "/page5/index");
    equals(page.dest.ext, ".html");
    equals(
      page.data.date?.getTime(),
      new Date(Date.UTC(1979, 5, 21, 23, 45, 0)).getTime(),
    );
  });

  testPage(site, "/pages/2021-12-29_page6", (page) => {
    equals(page.data.url, "/pages/page6/");
    equals(page.data.title, "Page 6");
    equals(page.data.tags?.length, 3);
    equals(page.data.tags?.[0], "pages");
    equals(page.data.site, "Folder overrided site name");
    equals(page.dest.path, "/pages/page6/index");
    equals(page.dest.ext, ".html");
    equals(
      page.data.date?.getTime(),
      new Date(Date.UTC(2022, 0, 1, 0, 0, 0)).getTime(),
    );
  });

  // Test binary loader
  testPage(site, "/favicon", (page) => {
    equals(page.data.url, "/favicon.png");
    equals(page.dest.path, "/favicon");
    equals(page.dest.ext, ".png");
    equals(typeof page.content, "object");
    assert(page.content instanceof Uint8Array);
  });

  // Test non HTML pages
  testPage(site, "/styles", (page) => {
    assert(page.document === undefined);
    equals(page.data.url, "/styles.css");
    equals(page.dest.path, "/styles");
    equals(page.dest.ext, ".css");
    equals(typeof page.content, "string");
  });
});

Deno.test("ignored draft pages on dev=false", async () => {
  const site = getSite({
    dev: false,
    src: "normal",
  });

  site.copy("static.yml");

  await site.build();

  equals(site.pages.length, 5);
});
