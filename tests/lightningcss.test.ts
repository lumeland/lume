import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import lightningcss from "../plugins/lightningcss.ts";

Deno.test("lightningcss plugin (only transform)", async (t) => {
  const site = getSite({
    src: "lightningcss",
  });

  site.use(lightningcss({
    includes: false,
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("lightningcss plugin (bundle mode)", async (t) => {
  const site = getSite({
    src: "lightningcss",
  });

  site.use(lightningcss());

  await build(site);
  await assertSiteSnapshot(t, site);
});
