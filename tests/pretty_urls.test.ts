import { assertSiteSnapshot, build, getSite } from "./utils.ts";

Deno.test("Disabled pretty URLs", async (t) => {
  const site = getSite({
    src: "simple",
    prettyUrls: false,
  });

  await build(site);
  await assertSiteSnapshot(t, site);
});
