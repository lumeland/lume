import { assertSiteSnapshot, build, getSite } from "./utils.ts";

Deno.test("Build a site with js/ts modules", async (t) => {
  const site = getSite({
    src: "module",
    location: new URL("https://example.com/blog"),
  });

  await build(site);
  await assertSiteSnapshot(t, site);
});
