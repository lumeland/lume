import { assertSiteSnapshot, build, getSite } from "./utils.ts";

Deno.test("Disabled pretty URLs", async (t) => {
  const site = getSite({
    src: "simple",
    prettyUrls: false,
  });

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("Pretty URLs with no-html-extension", async (t) => {
  const site = getSite({
    src: "simple",
    prettyUrls: "no-html-extension",
  });

  await build(site);
  await assertSiteSnapshot(t, site);
});
