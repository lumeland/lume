import { assertSiteSnapshot, build, getSite, runRequest } from "./utils.ts";
import { assertEquals } from "../deps/assert.ts";

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

  // copied with the trailing slash
  site.copy("other2/");

  // not copied because of the trailing slash
  site.copy("three.no/");

  // Copy a directory inside a ignored directory
  site.copy("_static/inner", "inner");

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("Ensure file doesn't resolve outside root", async () => {
  const site = getSite({
    src: "static_files",
  });

  const server = site.server();

  const response = await runRequest(
    server,
    new Request("http://localhost/..%2fno.txt"),
  );

  await response.body?.cancel();
  assertEquals(response.status, 404);
});
