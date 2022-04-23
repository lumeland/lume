import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import jsx from "../plugins/jsx.ts";

Deno.test("build a site with jsx/tsx modules", async (t) => {
  const site = getSite({
    src: "jsx",
    location: new URL("https://example.com/blog"),
  });

  site.use(jsx());

  await build(site);
  await assertSiteSnapshot(t, site);
});
