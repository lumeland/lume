import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import toml from "../plugins/toml.ts";

Deno.test("TOML plugin", async (t) => {
  const site = getSite({
    src: "toml",
  });

  site.use(toml());

  await build(site);
  await assertSiteSnapshot(t, site);
});
