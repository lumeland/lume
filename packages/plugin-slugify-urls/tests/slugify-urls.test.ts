import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import slugifyUrls from "../src/mod.ts";
import createSlugifier from "@lumeland/core/slugifier.ts";
import unidecode from "unidecode";
import jaconv from "jaconv";

describe("slugify-urls plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(slugifyUrls());
    site.add([".css"]);
    site.add("_headers");

    expect(await build(site)).toMatchSnapshot();
  });

  it("should match site with static files", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(
      slugifyUrls({
        extensions: "*",
      }),
    );
    site.add([".css"]);
    site.add("_headers");

    expect(await build(site)).toMatchSnapshot();
  });

  it("slugify clean urls", () => {
    const slugify = createSlugifier();

    expect(slugify("Hello / World")).toBe("hello/world");
    expect(slugify("hello_/_world")).toBe("hello/world");
    expect(slugify("200,000*7")).toBe("200-000-7");
    expect(slugify("img/Image 2 ")).toBe("img/image-2");
  });

  it("slugify replacement chars", () => {
    const slugify = createSlugifier();

    expect(slugify("Ð")).toBe("d");
    expect(slugify("ð")).toBe("d");
    expect(slugify("№")).toBe("no");
  });

  it("slugify forbidden characters and words", () => {
    const slugify = createSlugifier({
      stopWords: ["or", "and", "the"],
    });

    expect(slugify("")).toBe("");
    expect(slugify("the man or the woman")).toBe("man-woman");
    expect(slugify("  forks   and   knives   ")).toBe("forks-knives");
    expect(slugify("went down the road")).toBe("went-down-road");
  });

  it("slugify support unicode characters", () => {
    const slugify = createSlugifier({
      transliterate: {
        zh: unidecode,
        // @ts-expect-error: types are not correct
        ja: jaconv.toHebon,
      },
    });

    expect(slugify("Lume 支持中文，中文标点。？、【】｛｝！￥（）", "zh")).toBe(
      "lume-zhi-chi-zhong-wen-zhong-wen-biao-dian-y",
    );

    expect(slugify("Lume はガリシア語で炎と言う意味でルメと発音する", "ja")).toBe(
      "lume-hadetoudetosuru",
    );
  });
});
