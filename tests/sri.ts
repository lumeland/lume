import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import sri from "../plugins/sri.ts";

Deno.test("SRI plugin", async (t) => {
  const site = getSite({
    src: "sri",
  });

  site.use(sri());

  await build(site);
  await assertSiteSnapshot(t, site);
});
