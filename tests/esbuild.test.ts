import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import esbuild from "../plugins/esbuild.ts";
import jsx from "../plugins/jsx.ts";

// Disable sanitizeOps & sanitizeResources because esbuild doesn't close them
Deno.test(
  "esbuild plugin",
  { sanitizeOps: false, sanitizeResources: false },
  async (t) => {
    const site = getSite({
      src: "esbuild",
    });

    site.data("basename", "util/toLower", "/other/to_lowercase.ts");

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

    site.data("basename", "util/toLower", "/other/to_lowercase.ts");

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
    let chunkIndex = 0;
    const chunkMap: { [chunk: string]: string } = {};
    for (const page of site.pages) {
      const url = page.data.url;

      const match = url.match(/chunk-[\w]{8}\.js/);
      if (!match) {
        continue;
      }

      page.data.url = url.replace(
        /chunk-[\w]{8}\.js/,
        `chunk-${chunkIndex}.js`,
      );
      page.data.basename = page.data.basename.replace(
        /chunk-[\w]{8}/,
        `chunk-${chunkIndex}`,
      );
      chunkMap[match[0]] = `chunk-${chunkIndex}.js`;
      chunkIndex += 1;
    }
    for (const page of site.pages) {
      let content = page.content as string;
      for (
        const [originalChunkName, newChunkName] of Object.entries(chunkMap)
      ) {
        content = content.replace(originalChunkName, newChunkName);
      }
      page.content = content;
    }

    await assertSiteSnapshot(t, site);
  },
);

// Disable sanitizeOps & sanitizeResources because esbuild doesn't close them
Deno.test(
  "esbuild plugin with JSX",
  { sanitizeOps: false, sanitizeResources: false },
  async (t) => {
    const site = getSite({
      src: "esbuild_jsx",
    });

    site.data("basename", "util/toLower", "/other/to_lowercase.ts");

    site.use(jsx({
      pageSubExtension: ".page",
    }));

    site.use(esbuild({
      extensions: [".jsx", ".tsx"],
    }));

    await build(site);
    await assertSiteSnapshot(t, site);
  },
);

// Disable sanitizeOps & sanitizeResources because esbuild doesn't close them
Deno.test(
  "esbuild plugin with outExtension",
  { sanitizeOps: false, sanitizeResources: false },
  async (t) => {
    const site = getSite({
      src: "esbuild",
    });

    site.data("basename", "util/toLower", "/other/to_lowercase.ts");

    site.use(esbuild({
      options: {
        outExtension: { ".js": ".min.js" },
      },
    }));

    await build(site);
    await assertSiteSnapshot(t, site);
  },
);

// Disable sanitizeOps & sanitizeResources because esbuild doesn't close them
Deno.test(
  "esbuild plugin with entryNames simple",
  { sanitizeOps: false, sanitizeResources: false },
  async (t) => {
    const site = getSite({
      src: "esbuild",
    });

    site.data("basename", "util/toLower", "/other/to_lowercase.ts");

    site.use(esbuild({
      options: {
        entryNames: "js/[name].hash",
      },
    }));

    await build(site);
    await assertSiteSnapshot(t, site);
  },
);

// Disable sanitizeOps & sanitizeResources because esbuild doesn't close them
Deno.test(
  "esbuild plugin with entryNames complex",
  { sanitizeOps: false, sanitizeResources: false },
  async (t) => {
    const site = getSite({
      src: "esbuild",
    });

    site.data("basename", "util/toLower", "/other/to_lowercase.ts");

    site.use(esbuild({
      options: {
        entryNames: "one/[dir]/two/[name]/hash",
      },
    }));

    await build(site);
    await assertSiteSnapshot(t, site);
  },
);

// Disable sanitizeOps & sanitizeResources because esbuild doesn't close them
Deno.test(
  "esbuild plugin without bundle",
  { sanitizeOps: false, sanitizeResources: false },
  async (t) => {
    const site = getSite({
      src: "esbuild",
    });

    site.data("basename", "util/toLower", "/other/to_lowercase.ts");

    site.use(esbuild({
      options: {
        bundle: false,
        entryNames: "[dir]/[name].hash",
        outExtension: { ".js": ".min.js" },
      },
    }));

    await build(site);
    await assertSiteSnapshot(t, site);
  },
);
