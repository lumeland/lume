import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import sitemap from "../plugins/sitemap.ts";
import multilanguage from "../plugins/multilanguage.ts";
import filterPages from "../plugins/filter_pages.ts";
import redirects from "../plugins/redirects.ts";
import extractDate from "../plugins/extract_date.ts";

Deno.test("Sitemap plugin", async (t) => {
  const site = getSite({
    src: "normal",
    location: new URL("https://example.com/"),
  });

  site.use(sitemap({
    stylesheet: "/sitemap-style.xml",
  }));
  site.use(extractDate());
  site.ignore("static.yml");

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("Sitemap plugin with a multilanguage plugin", async (t) => {
  const site = getSite({
    src: "multilanguage",
    location: new URL("https://example.com/"),
  });

  site.use(multilanguage({
    defaultLanguage: "gl",
    languages: ["en", "fr", "it", "gl"],
  }));
  site.use(extractDate());
  site.use(sitemap({
    items: {
      lastmod: "",
    },
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("Sitemap plugin with filter_pages plugin", async (t) => {
  const site = getSite({
    src: "normal",
    location: new URL("https://example.com/"),
  });

  site.ignore("static.yml");
  site.use(filterPages({
    fn: (page) => page.data.url !== "/pages/new-name/page7/",
  }));
  site.use(sitemap());
  site.use(extractDate());

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("Sitemap plugin with redirects plugin", async (t) => {
  const site = getSite({
    src: "redirects",
    location: new URL("https://example.com/"),
  });

  site.use(sitemap());
  site.use(redirects());
  site.use(extractDate());

  await build(site);
  await assertSiteSnapshot(t, site);
});
