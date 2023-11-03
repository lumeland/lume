import { assertSiteSnapshot, build, getSite } from "./utils.ts";

Deno.test("build a site with vento", async (t) => {
  const site = getSite({
    src: "vento",
    location: new URL("https://example.com/blog"),
  });

  site.filter("upper", (value: string) => value.toUpperCase());

  await build(site);
  await assertSiteSnapshot(t, site);
});
