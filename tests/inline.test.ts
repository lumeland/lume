import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import inline from "../plugins/inline.ts";
import binaryLoader from "../core/loaders/binary.ts";

Deno.test("inline plugin", async (t) => {
  const site = getSite({
    src: "inline",
  });

  site.use(inline({
    copyAttributes: ["custom", /^data-/, /^@/],
  }));
  site.loadAssets([".svg", ".js"]);
  site.loadAssets([".png"], binaryLoader);
  site.copy("favicon.png", "favicon2.png");

  await build(site);
  await assertSiteSnapshot(t, site);
});
