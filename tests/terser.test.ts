import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import terser from "../plugins/terser.ts";

Deno.test("terser plugin", async (t) => {
  const site = getSite({
    src: "terser",
  });

  site.use(terser());

  await build(site);
  await assertSiteSnapshot(t, site);
});
