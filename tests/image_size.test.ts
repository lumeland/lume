import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import imageSize from "../plugins/image_size.ts";

Deno.test("ImageSize plugin", async (t) => {
  const site = getSite({
    src: "image_size",
  });

  site.add("/");
  site.use(imageSize());

  await build(site);
  await assertSiteSnapshot(t, site);
});
