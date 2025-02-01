import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import imageTransform from "../plugins/transform_images.ts";

Deno.test("Image transform plugin", async (t) => {
  const site = getSite({
    src: "transform_images",
  });

  site.add("/");
  site.use(imageTransform({
    cache: false,
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
