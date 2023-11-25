import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import postcss from "../plugins/postcss.ts";
import unocss from "../plugins/unocss.ts";

Deno.test("Unocss plugin", async (t) => {
  const site = getSite({
    src: "unocss",
  });

  site.use(unocss());
  site.use(postcss());

  await build(site);
  await assertSiteSnapshot(t, site);
});
