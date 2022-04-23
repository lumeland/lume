import { assertStrictEquals as equals } from "../deps/assert.ts";
import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import slugifyUrls, { createSlugifier } from "../plugins/slugify_urls.ts";

Deno.test("slugify_urls plugin", async (t) => {
  const site = getSite({
    src: "slugify_urls",
  });

  site.use(slugifyUrls());

  await build(site);
  await assertSiteSnapshot(t, site);
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
