import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import postcss from "../plugins/postcss.ts";
import esbuild from "../plugins/esbuild.ts";

Deno.test("render remote files", {
  sanitizeOps: false,
  sanitizeResources: false,
  ignore: true,
}, async (t) => {
  const site = getSite({
    src: "remote_files",
  });
  site.copy("asset.txt");
  site.use(postcss());
  site.use(esbuild());

  const base = new URL("./assets/remote_files/_remotes/", import.meta.url);

  site.remoteFile("_includes/remote1.njk", new URL("./remote1.njk", base).href);
  site.remoteFile(
    "_includes/templates/remote-template2.njk",
    new URL("./remote-template2.njk", base).href,
  );
  site.remoteFile("asset.txt", new URL("./asset.txt", base).href);
  site.remoteFile("styles2.css", new URL("./styles2.css", base).href);
  site.remoteFile(
    "_includes/remote-style.css",
    new URL("./remote-style.css", base).href,
  );
  site.remoteFile(
    "other-remote-style.css",
    new URL("./other-remote-style.css", base).href,
  );
  site.remoteFile("_data.yml", new URL("./_data.yml", base).href);
  site.remoteFile("_includes/hello.js", new URL("./hello.js", base).href);

  await build(site);
  await assertSiteSnapshot(t, site);
});
