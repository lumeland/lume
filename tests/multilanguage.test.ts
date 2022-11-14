import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import multilanguage from "../plugins/multilanguage.ts";

Deno.test("multilanguage plugin", async (t) => {
  const site = getSite({
    src: "multilanguage",
  });

  site.use(multilanguage());

  await build(site);
  await assertSiteSnapshot(t, site);
});
