import { assertSiteSnapshot, build, getSite } from "./utils.ts";

Deno.test("build a site with vento", async (t) => {
  const site = getSite({
    src: "vento",
    location: new URL("https://example.com/blog"),
  });

  site.filter("upper", (value: string) => value.toUpperCase());
  site.filter("fromPage", function (key) {
    return this?.data?.[key];
  });
  site.filter("fromPageAsync", function (key) {
    return Promise.resolve(this?.data?.[key]);
  }, true);

  await build(site);
  await assertSiteSnapshot(t, site);
});
