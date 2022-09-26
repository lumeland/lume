import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import remark from "../plugins/remark.ts";

Deno.test("Build a markdown site", async (t) => {
  const site = getSite({
    dev: true,
    src: "remark",
  });

  site.use(remark());

  await build(site);
  await assertSiteSnapshot(t, site);
});
