import { assertStrictEquals as equals } from "../deps/assert.ts";
import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import slugifyUrls from "../plugins/slugify_urls.ts";
import createSlugifier from "../core/slugifier.ts";
import unidecode from "npm:unidecode@1.1.0";
import jaconv from "npm:jaconv@1.0.4";

Deno.test("slugify_urls plugin", async (t) => {
  const site = getSite({
    src: "slugify_urls",
  });

  site.use(slugifyUrls());
  site.add([".css"]);
  site.add("_headers");

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("slugify_urls plugin (static files)", async (t) => {
  const site = getSite({
    src: "slugify_urls",
  });

  site.use(slugifyUrls({
    extensions: "*",
  }));
  site.add([".css"]);
  site.add("_headers");

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("slugify clean urls", () => {
  const slugify = createSlugifier();

  equals(slugify("Hello / World"), "hello/world");
  equals(slugify("hello_/_world"), "hello/world");
  equals(slugify("200,000*7"), "200-000-7");
  equals(slugify("img/Image 2 "), "img/image-2");
});

Deno.test("slugify replacement chars", () => {
  const slugify = createSlugifier();

  equals(slugify("Ð"), "d");
  equals(slugify("ð"), "d");
  equals(slugify("№"), "no");
});

Deno.test("slugify forbidden characters and words", () => {
  const slugify = createSlugifier({
    stopWords: ["or", "and", "the"],
  });

  equals(slugify(""), "");
  equals(slugify("the man or the woman"), "man-woman");
  equals(slugify("  forks   and   knives   "), "forks-knives");
  equals(slugify("went down the road"), "went-down-road");
});

Deno.test("slugify support unicode characters", () => {
  const slugify = createSlugifier({
    transliterate: {
      zh: unidecode,
      ja: jaconv.toHebon,
    },
  });

  equals(
    slugify("Lume 支持中文，中文标点。？、【】｛｝！￥（）", "zh"),
    "lume-zhi-chi-zhong-wen-zhong-wen-biao-dian-y",
  );

  equals(
    slugify("Lume はガリシア語で炎と言う意味でルメと発音する", "ja"),
    "lume-hadetoudetosuru",
  );
});
