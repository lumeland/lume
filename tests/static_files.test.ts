import { assertSiteSnapshot, build, getSite } from "./utils.ts";

Deno.test("Copy static files", async (t) => {
  const site = getSite({
    src: "static_files",
  });

  site.copy("static", ".");
  site.copy("other");
  site.copy([".css", ".js"]);

  await build(site);
  await assertSiteSnapshot(t, site);
});
