import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import lightningcss from "../plugins/lightningcss.ts";

Deno.test("lightningcss plugin", async (t) => {
  const site = getSite({
    src: "lightningcss",
  });

  site.use(lightningcss({
    sourceMap: true,
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
