import { assertStrictEquals as equals } from "../deps/assert.ts";
import { getSite, testPage } from "./utils.ts";
import slugifyUrls, { createSlugifier } from "../plugins/slugify_urls.ts";

Deno.test("slugify_urls plugin", async () => {
  const site = getSite({
    test: true,
    src: "slugify_urls",
  });

  site.use(slugifyUrls());
  await site.build();

  testPage(site, "/Page 1", (page) => {
    equals(page.data.url, "/page-1/");
  });

  testPage(site, "/Chourizos ao viño", (page) => {
    equals(page.data.url, "/chourizos-ao-vino/");
  });

  testPage(site, "/page-3", (page) => {
    equals(page.data.url, "/paxina-numero/tres/");
  });
});

Deno.test("slugifier function", () => {
  const slugify = createSlugifier();

  equals(slugify("Ð"), "d");
  equals(slugify("ð"), "d");
  equals(slugify("Hello / World"), "hello/world");
  equals(slugify("hello_/_world"), "hello/world");
  equals(slugify("200,000*7"), "200-000-7");
  equals(slugify("img/Image 2 .png"), "img/image-2.png");
  equals(slugify("№"), "no");
});
