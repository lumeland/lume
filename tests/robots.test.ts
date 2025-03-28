import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import robots from "../plugins/robots.ts";
import extractDate from "../plugins/extract_date.ts";

Deno.test("Robots plugin", async (t) => {
  const site = getSite({
    src: "normal",
    location: new URL("https://example.com/"),
  });

  site.use(robots());
  site.use(extractDate());
  site.ignore("static.yml");

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("Robots plugin with allow", async (t) => {
  const site = getSite({
    src: "normal",
    location: new URL("https://example.com/"),
  });

  site.use(robots({
    allow: ["Googlebot", "Bingbot"],
  }));
  site.use(extractDate());
  site.ignore("static.yml");

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("Robots plugin with disallow", async (t) => {
  const site = getSite({
    src: "normal",
    location: new URL("https://example.com/"),
  });

  site.use(robots({
    disallow: "ChatGPT-User",
  }));
  site.use(extractDate());
  site.ignore("static.yml");

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("Robots plugin with custom rules", async (t) => {
  const site = getSite({
    src: "normal",
    location: new URL("https://example.com/"),
  });

  site.use(robots({
    rules: [
      {
        userAgent: "*",
        disallow: "/admin",
      },
      {
        sitemap: new URL("/sitemap.xml", site.options.location).href,
      },
    ],
  }));
  site.ignore("static.yml");
  site.use(extractDate());

  await build(site);
  await assertSiteSnapshot(t, site);
});
