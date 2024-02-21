import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import robots from "../plugins/robots.ts";

Deno.test("Robots plugin", async (t) => {
  const site = getSite({
    src: "normal",
    location: new URL("https://example.com/"),
  });

  site.use(robots());
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

  await build(site);
  await assertSiteSnapshot(t, site);
});
