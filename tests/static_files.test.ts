import { assertSiteSnapshot, build, getSite } from "./utils.ts";

Deno.test("Copy static files", async (t) => {
  const site = getSite({
    src: "static_files",
  });

  site.add("static", ".");
  site.add("other");
  site.add(
    "posts/2022-01-01_first-post/assets",
    (file) => file.replace(".scss", ".css"),
  );
  site.add("posts/2022-01-01_first-post/individual-file");
  site.add([".css", ".js"]);
  site.add([".copy"]);
  site.add("_headers");
  site.add("static/_redirects", "_redirects");
  site.add(
    [".copy2"],
    (file) => "/subdir" + file.replace(/\.copy2/, ".copy3"),
  );

  // copied with the trailing slash
  site.add("other2/");

  // not copied because of the trailing slash
  site.add("three.no/");

  // Copy a directory inside a ignored directory
  site.add("_static/inner", "inner");

  await build(site);
  await assertSiteSnapshot(t, site);
});
