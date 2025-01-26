import { assertSiteSnapshot, build, getSite } from "./utils.ts";

Deno.test("url and htmlUrl update href", async (t) => {
  const site = getSite({
    src: "url",
    location: new URL("https://example.com/test/"),
  });

  await build(site);
  await assertSiteSnapshot(t, site);
});
