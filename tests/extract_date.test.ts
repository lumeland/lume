import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import extractDate from "../plugins/extract_date.ts";

Deno.test("extract_date plugin", async (t) => {
  const site = getSite({
    src: "normal",
  });

  site.use(extractDate());

  await build(site);
  await assertSiteSnapshot(t, site);
});
