import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import sass from "../plugins/sass.ts";

Deno.test("SASS plugin", async (t) => {
  const site = getSite({
    src: "sass",
  });
  site.add([".scss", ".sass"]);
  site.use(sass());

  await build(site);
  await assertSiteSnapshot(t, site);
});
