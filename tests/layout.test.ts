import { assertSiteSnapshot, build, getSite } from "./utils.ts";

Deno.test("Layouts", async (t) => {
  const site = getSite({
    src: "layouts",
  });

  site.add([".css"]);

  await build(site);
  await assertSiteSnapshot(t, site);
});
