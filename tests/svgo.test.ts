import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import svgo from "../plugins/svgo.ts";

Deno.test("SVGO plugin", async (t) => {
  const site = getSite({
    src: "svgo",
  });

  site.add("favicon.svg");
  site.use(svgo());

  await build(site);
  await assertSiteSnapshot(t, site);
});
