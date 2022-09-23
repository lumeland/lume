import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import sheets from "../plugins/sheets.ts";

Deno.test("Sheets plugin", async (t) => {
  const site = getSite({
    src: "sheets",
  });

  site.use(sheets());

  await build(site);
  await assertSiteSnapshot(t, site);
});
