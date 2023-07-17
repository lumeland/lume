import { assertSiteSnapshot, build, getSite } from "./utils.ts";

Deno.test("TOML plugin", async (t) => {
  const site = getSite({
    src: "toml",
  });

  await build(site);
  await assertSiteSnapshot(t, site);
});
