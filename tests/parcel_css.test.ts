import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import parcelCss from "../plugins/parcel_css.ts";

Deno.test("parcelCSS plugin", async (t) => {
  const site = getSite({
    src: "parcel_css",
  });

  site.use(parcelCss({
    sourceMap: true,
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
