import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import epub from "../plugins/epub.ts";

Deno.test(
  "epub plugin",
  { sanitizeOps: false, sanitizeResources: false },
  async (t) => {
    const site = getSite({
      src: "epub",
    });

    site.use(epub({
      outputUncompressed: true,
      metadata: {
        date: new Date("2026-01-08T19:00:00"),
      },
    }));

    await build(site);
    await assertSiteSnapshot(t, site);
  },
);
