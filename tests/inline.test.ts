import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import inline from "../plugins/inline.ts";
import basePath from "../plugins/base_path.ts";

Deno.test("inline plugin", async (t) => {
  const site = getSite({
    src: "inline",
  });

  site.use(inline({
    copyAttributes: ["custom", /^data-/, /^@/],
  }));

  site.add([".svg", ".js", ".png"]);
  site.add("favicon.png", "favicon2.png");

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("inline plugin (sourceURL)", async (t) => {
  const site = getSite({
    src: "inline",
  });

  site.use(inline({
    copyAttributes: ["custom", /^data-/, /^@/],
    sourceURL: true,
  }));

  site.add([".svg", ".js", ".png"]);
  site.add("favicon.png", "favicon2.png");

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("inline plugin (basePath)", async (t) => {
  const site = getSite({
    location: new URL("https://example.com/blog/"),
    src: "inline",
  });

  site.use(basePath());
  site.use(inline());

  site.add([".svg", ".js", ".png"]);
  site.add("favicon.png", "favicon2.png");

  await build(site);
  await assertSiteSnapshot(t, site);
});
