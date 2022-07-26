import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import sass from "../plugins/sass.ts";

Deno.test("sass plugin", async (t) => {
  const site = getSite({
    src: "sass",
  });

  site.use(sass({
    sourceMap: true,
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
