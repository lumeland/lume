import { assertSiteSnapshot, build, getSite } from "./utils.ts";

Deno.test("Copy static files", async (t) => {
  const site = getSite({
    src: "static_files",
  });

  site.copy("static", ".");
  site.copy("other");
  site.copy(
    "posts/2022-01-01_first-post/assets",
    (file) => file.replace(".scss", ".css"),
  );
  site.copy("posts/2022-01-01_first-post/individual-file");
  site.copy([".css", ".js"]);
  site.copy([".copy"]);
  site.copy("_headers");
  site.copy("static/_redirects", "_redirects");
  site.copy(
    [".copy2"],
    (file) => "/subdir" + file.replace(/\.copy2/, ".copy3"),
  );

  // a single file can be copied multiple times
  site.copy("one.yes");
  site.copy("one.yes", "one-again.yes");

  // copied with the trailing slash
  site.copy("other2/");

  // not copied because of the trailing slash
  site.copy("three.no/");

  await build(site);
  await assertSiteSnapshot(t, site);
});
