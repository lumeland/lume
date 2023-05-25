import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import lightningcss from "../plugins/lightningcss.ts";

Deno.test("lightningcss plugin", async (t) => {
  const site = getSite({
    src: "lightningcss",
  });

  site.use(lightningcss());

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("lightningcss plugin (bundle mode)", async (t) => {
  const site = getSite({
    src: "lightningcss",
  });

  site.use(lightningcss({
    includes: "_includes",
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
