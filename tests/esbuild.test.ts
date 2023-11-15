import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import esbuild from "../plugins/esbuild.ts";

// Disable sanitizeOps & sanitizeResources because esbuild doesn't close them
Deno.test(
  "esbuild plugin",
  { sanitizeOps: false, sanitizeResources: false },
  async (t) => {
    const site = getSite({
      src: "esbuild",
    });

    // Test ignore with a function filter
    site.ignore((path) => path === "/modules" || path.startsWith("/modules/"));
    site.use(esbuild());

    await build(site);
    await assertSiteSnapshot(t, site);
  },
);

// Disable sanitizeOps & sanitizeResources because esbuild doesn't close them
Deno.test(
  "esbuild plugin with splitting as true",
  { sanitizeOps: false, sanitizeResources: false },
  async (t) => {
    const site = getSite({
      src: "esbuild",
    });

    // Test ignore with a function filter
    site.ignore((path) => path === "/modules" || path.startsWith("/modules/"));
    site.use(esbuild({
      options: {
        splitting: true,
        outdir: "foo",
      },
    }));

    await build(site);

    // Normalize chunk name
    site.pages.forEach((page) => {
      const url = page.data.url;
      if (!url) return;
      if (url.match(/chunk-[\w]{8}\.js/)) {
        page.data.url = url.replace(/chunk-[\w]{8}\.js/, "chunk.js");
        page.data.slug = page.data.slug.replace(/chunk-[\w]{8}\.js/, "chunk");
      } else {
        const content = page.content as string;
        page.content = content.replace(/chunk-[\w]{8}\.js/, "chunk.js");
      }
    });

    await assertSiteSnapshot(t, site);
  },
);
