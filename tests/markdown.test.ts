import { assertSiteSnapshot, build, getSite } from "./utils.ts";

Deno.test("Build a markdown site", async (t) => {
  const site = getSite({
    src: "markdown",
    location: new URL("https://example.com/blog"),
  });

  await build(site);
  await assertSiteSnapshot(t, site);
});
