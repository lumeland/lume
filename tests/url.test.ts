import { assertSiteSnapshot, build, getSite } from "./utils.ts";

Deno.test("url and htmlUrl update href", async (t) => {
  const site = getSite({
    src: "url",
    location: new URL("https://example.com/test/"),
  });

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("configure url and htmlUrl names", async (t) => {
  const site = getSite({
    src: "url",
    location: new URL("https://example.com/"),
  }, {
    url: {
      names: {
        url: "urlify",
        htmlUrl: "htmlUrlify",
      },
    },
  });

  await build(site);
  await assertSiteSnapshot(t, site);
});
