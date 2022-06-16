import { assertSiteSnapshot, build, getSite } from "./utils.ts";

Deno.test("render order property", async (t) => {
  const site = getSite({
    src: "render_order",
  });

  await build(site);
  await assertSiteSnapshot(t, site);
});
