import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import basePath from "../plugins/base_path.ts";

Deno.test("base_path plugin", async (t) => {
  const site = getSite({
    src: "base_path",
    location: new URL("https://example.com/blog"),
  });

  site.use(basePath());

  await build(site);
  await assertSiteSnapshot(t, site);
});
