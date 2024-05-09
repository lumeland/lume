import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import transformImages from "../plugins/transform_images.ts";
import picture from "../plugins/picture.ts";

Deno.test("picture plugin", async (t) => {
  const site = getSite({
    src: "picture",
  });

  site.use(picture());
  site.use(transformImages({
    cache: false,
  }));

  await build(site);
  await assertSiteSnapshot(t, site, {
    avoidBinaryFilesLength: true,
  });
});
