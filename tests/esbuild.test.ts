import { assert, assertStrictEquals as equals } from "../deps/assert.ts";
import { build, getSite, testPage } from "./utils.ts";
import esbuild from "../plugins/esbuild.ts";

// Disable sanitizeOps & sanitizeResources because esbuild doesn't close them
Deno.test(
  "esbuild plugin",
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const site = getSite({
      src: "esbuild",
    });

    site.ignore("modules");
    site.use(esbuild());

    await build(site);

    const { formats } = site;

    // Register the loader extensions
    assert(formats.has(".ts"));
    assert(formats.has(".js"));
    equals(formats.get(".ts")?.pageType, "asset");
    equals(formats.get(".js")?.pageType, "asset");

    // Register the loader extensions
    testPage(site, "/main", (page) => {
      equals(page.dest.path, "/main");
      equals(page.dest.ext, ".js");
      equals(page.data.url, "/main.js");

      const content = page.content as string;
      assert(content.includes('t(r,"toUppercase")'));
    });
  },
);
