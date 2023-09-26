import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import vento from "../plugins/vento.ts";

Deno.test("build a site with vento", async (t) => {
  const site = getSite({
    src: "vento",
    location: new URL("https://example.com/blog"),
  });

  site.use(vento());
  site.filter("upper", (value: string) => value.toUpperCase());

  await build(site);
  await assertSiteSnapshot(t, site);
});
