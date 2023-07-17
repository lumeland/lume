import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import imagick from "../plugins/imagick.ts";
import picture from "../plugins/picture.ts";

Deno.test("imagick plugin", async (t) => {
  const site = getSite({
    src: "picture",
  });

  site.use(picture());
  site.use(imagick({
    cache: false,
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
