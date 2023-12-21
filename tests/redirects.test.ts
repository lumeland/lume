import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import redirects from "../plugins/redirects.ts";

Deno.test("redirects plugin", async (t) => {
  const site = getSite({
    src: "redirects",
  });

  site.use(redirects());

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("redirects plugin for netlify", async (t) => {
  const site = getSite({
    src: "redirects",
  });

  site.use(redirects({
    output: "netlify",
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("redirects plugin for vercel", async (t) => {
  const site = getSite({
    src: "redirects",
  });

  site.use(redirects({
    output: "vercel",
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
