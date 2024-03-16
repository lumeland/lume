import { assertSiteSnapshot, build, getSite } from "./utils.ts";

Deno.test(".well-known folder", async (t) => {
  const site = getSite({
    src: "well_known",
  });

  await build(site);
  await assertSiteSnapshot(t, site);
});
