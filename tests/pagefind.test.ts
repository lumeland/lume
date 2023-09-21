import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import pagefind from "../plugins/pagefind.ts";

Deno.test(
  "Pagefind plugin",
  { ignore: Deno.build.os === "windows" },
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
