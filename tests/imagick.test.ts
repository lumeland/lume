import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import imagick from "../plugins/imagick.ts";

Deno.test("imagick plugin", async (t) => {
  const site = getSite({
    src: "imagick",
  });

  site.use(imagick({
    cache: false,
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
