import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import inline from "../plugins/inline.ts";

Deno.test("inline plugin", async (t) => {
  const site = getSite({
    src: "inline",
  });

  site.use(inline({
    copyAttributes: ["custom", /^data-/, /^@/],
  }));

  site.add([".svg", ".js", ".png"]);
  site.add("favicon.png", "favicon2.png");

  await build(site);
  await assertSiteSnapshot(t, site);
});
