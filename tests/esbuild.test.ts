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

    site.ignore("modules");
    site.use(esbuild());

    await build(site);
    await assertSiteSnapshot(t, site);
  },
);
