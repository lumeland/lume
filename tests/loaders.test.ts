import { assert, assertStrictEquals as equals } from "../deps/assert.ts";
import { getPage, getSite } from "./utils.ts";

Deno.test("load the pages of a site", async () => {
  const site = getSite({
    test: true,
    dev: true,
    src: "normal",
  });

  await site.build();

  // Test the generated pages
  equals(site.pages.length, 5);

  // The data is merged
  const page1 = getPage(site, "/pages/1_page1");

  assert(page1);
  assert(page1.data.draft);
  equals(page1.data.url, "/pages/page1/");
  equals(page1.data.title, "Page 1");
  equals(page1.data.tags?.length, 2);
  equals(page1.data.tags?.[0], "pages");
  equals(page1.data.tags?.[1], "page1");
  equals(page1.data.site, "Default site name");
  equals(page1.dest.path, "/pages/page1/index");
  equals(page1.dest.ext, ".html");
  equals(page1.data.date?.getTime(), 1);

  // Shared data
  // @ts-ignore: unknown property
  equals(page1.data.colors.length, 3);
  // @ts-ignore: unknown property
  equals(page1.data.documents.length, 3);
  // @ts-ignore: unknown property
  equals(page1.data.drinks.alcoholic.length, 2);
  // @ts-ignore: unknown property
  equals(page1.data.names.length, 2);

  const page2 = getPage(site, "/pages/2020-06-21_page2");

  assert(page2);
  assert(!page2.data.draft);
  equals(page2.data.url, "/overrided-page2/");
  equals(page2.data.title, "Page 2");
  equals(page2.data.tags?.length, 1);
  equals(page2.data.tags?.[0], "pages");
  equals(page2.data.site, "Default site name");
  equals(page2.dest.path, "/overrided-page2/index");
  equals(page2.dest.ext, ".html");
  equals(page2.data.date?.getTime(), new Date(2020, 5, 21).getTime());

  // Shared data

  // @ts-ignore: unknown property
  assert(page1.data.colors === page2.data.colors);
  // @ts-ignore: unknown property
  assert(page1.data.documents === page2.data.documents);
  // @ts-ignore: unknown property
  assert(page1.data.drinks === page2.data.drinks);
  // @ts-ignore: unknown property
  assert(page1.data.names === page2.data.names);

  const page3 = getPage(site, "/pages/page3");

  assert(page3);
  assert(!page3.data.draft);
  equals(page3.data.url, "/page_3");
  equals(page3.data.title, "Page 3");
  equals(page3.data.tags?.length, 1);
  equals(page3.data.tags?.[0], "pages");
  equals(page3.data.site, "Default site name");
  equals(page3.dest.path, "/page_3");
  equals(page3.dest.ext, "");
  equals(page3.data.date?.getTime(), new Date(2020, 0, 1).getTime());

  const page4 = getPage(site, "/pages/2021-01-02-18-32_page4");

  assert(page4);
  assert(!page4.data.draft);
  equals(page4.data.url, "/pages/page4/");
  equals(page4.data.title, "Page 4");
  equals(page4.data.tags?.length, 1);
  equals(page4.data.tags?.[0], "pages");
  equals(page4.data.site, "Overrided site name");
  equals(page4.dest.path, "/pages/page4/index");
  equals(page4.dest.ext, ".html");
  // To-do: Maybe the date in the filenames should be created with Date.UTC?
  equals(page4.data.date?.getTime(), new Date(2021, 0, 2, 18, 32).getTime());

  const page5 = getPage(site, "/page5");

  assert(page5);
  assert(!page5.data.colors);
  assert(!page5.data.documents);
  assert(!page5.data.draft);
  equals(page5.data.url, "/page5/");
  equals(page5.data.title, "Page 5");
  equals(page5.data.tags?.length, 1);
  equals(page5.data.tags?.[0], "pages");
  equals(page5.data.site, "Default site name");
  equals(page5.dest.path, "/page5/index");
  equals(page5.dest.ext, ".html");
  equals(
    page5.data.date?.getTime(),
    new Date(Date.UTC(1979, 5, 21, 23, 45, 0)).getTime(),
  );
});

Deno.test("ignored draft pages on dev=false", async () => {
  const site = getSite({
    test: true,
    dev: false,
    src: "normal",
  });

  await site.build();

  equals(site.pages.length, 4);
});
