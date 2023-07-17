import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import jsx from "../plugins/jsx_preact.ts";

Deno.test("build a site with jsx/tsx modules using Preact", async (t) => {
  const site = getSite({
    src: "jsx_preact",
    location: new URL("https://example.com/blog"),
  });

  site.use(jsx());

  await build(site);
  await assertSiteSnapshot(t, site);
});
