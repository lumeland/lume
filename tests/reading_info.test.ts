import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import readingInfo from "../plugins/reading_info.ts";

Deno.test("Reading info plugin", async (t) => {
  const site = getSite({
    src: "reading_info",
  });

  site.use(readingInfo());

  await build(site);
  await assertSiteSnapshot(t, site);
});
