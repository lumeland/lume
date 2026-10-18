import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import extractDate from "@lumeland/plugin-extract-date/mod.ts";
import redirects from "@lumeland/plugin-redirects";
import filterPages from "@lumeland/plugin-filter-pages";
import multilanguage from "@lumeland/plugin-multilanguage";
import sitemap from "../src/mod.ts";

describe("sitemap plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
      location: new URL("https://example.com/"),
    });

    site.use(
      sitemap({
        stylesheet: "/sitemap-style.xml",
      }),
    );
    site.use(extractDate());

    expect(await build(site)).toMatchSnapshot();
  });

  it("should match multilanguage site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets-multilanguage"),
      location: new URL("https://example.com/"),
    });

    site.use(
      multilanguage({
        defaultLanguage: "gl",
        languages: ["en", "fr", "it", "gl"],
      }),
    );
    site.use(extractDate());
    site.use(
      sitemap({
        items: {
          lastmod: "",
        },
      }),
    );

    expect(await build(site)).toMatchSnapshot();
  });

  it("should match filtered site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
      location: new URL("https://example.com/"),
    });

    site.ignore("static.yml");
    site.use(
      filterPages({
        fn: (page) => page.data.url !== "/pages/new-name/page7/",
      }),
    );
    site.use(sitemap());
    site.use(extractDate());

    expect(await build(site)).toMatchSnapshot();
  });

  it("should match site snapshot with redirections", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets-redirect"),
      location: new URL("https://example.com/"),
    });

    site.use(sitemap());
    site.use(redirects());
    site.use(extractDate());

    expect(await build(site)).toMatchSnapshot();
  });
});
