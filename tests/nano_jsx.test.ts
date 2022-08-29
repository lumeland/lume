import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import jsx from "../plugins/nano_jsx.ts";

Deno.test("build a site with jsx/tsx modules using Nano JSX", async (t) => {
  const site = getSite({
    src: "nano_jsx",
    location: new URL("https://example.com/blog"),
  });

  site.use(jsx());

  await build(site);
  await assertSiteSnapshot(t, site);
});
