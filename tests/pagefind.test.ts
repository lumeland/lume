import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import pagefind from "../plugins/pagefind.ts";

Deno.test(
  "Pagefind plugin",
  { ignore: Deno.build.os !== "darwin" },
  async (t) => {
    const site = getSite({
      src: "pagefind",
    });

    site.use(pagefind());

    await build(site);
    await assertSiteSnapshot(t, site, {
      avoidBinaryFilesLength: true,
    });
  },
);

Deno.test(
  "Pagefind plugin with global variable & playground",
  { ignore: Deno.build.os !== "darwin" },
  async (t) => {
    const site = getSite({
      src: "pagefind",
    });

    site.use(pagefind({
      ui: {
        globalVariable: "pagefind",
      },
      indexing: { writePlayground: true },
    }));

    await build(site);
    await assertSiteSnapshot(t, site, {
      avoidBinaryFilesLength: true,
    });
  },
);
