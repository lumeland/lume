import { assertSiteSnapshot, build, getSite } from "./utils.ts";

Deno.test("JSON plugin", async (t) => {
  const site = getSite({
    src: "json",
  });

  await build(site);
  await assertSiteSnapshot(t, site);
});
