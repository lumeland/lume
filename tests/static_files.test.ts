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
  site.copy(
    [".copy2"],
    (file) => "/subdir" + file.replace(/\.copy2/, ".copy3"),
  );

  await build(site);
  await assertSiteSnapshot(t, site);
});
