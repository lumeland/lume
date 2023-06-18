import { assertSiteSnapshot, build, getSite } from "./utils.ts";

Deno.test("follow symlinks", async (t) => {
  const site = getSite({
    src: "symlinks/src",
  });

  await build(site);
  await assertSiteSnapshot(t, site);
});
