import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import relativeUrls from "../plugins/relative_urls.ts";

Deno.test("relative_url plugin", async (t) => {
  const site = getSite({
    src: "relative_urls",
    location: new URL("https://example.com/blog"),
  });

  site.use(relativeUrls());
  site.add([".css"]);

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("relative_url plugin when pretty urls disabled", async (t) => {
  const site = getSite({
    src: "relative_urls",
    location: new URL("https://example.com/blog"),
    prettyUrls: false,
  });

  site.use(relativeUrls());

  await build(site);
  await assertSiteSnapshot(t, site);
});
