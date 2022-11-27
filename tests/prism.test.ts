import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import prism from "../plugins/prism.ts";
import "npm:prismjs@1.29.0/components/prism-less.js";

Deno.test("Prism plugin", async (t) => {
  const site = getSite({
    src: "prism",
  });

  site.use(prism());

  await build(site);
  await assertSiteSnapshot(t, site);
});
