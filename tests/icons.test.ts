import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import icons from "../plugins/icons.ts";

Deno.test("icons plugin", async (t) => {
  const site = getSite({
    src: "icons",
  });

  site.data("sprite", false);
  site.use(icons());

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("icons plugin (sprite mode)", async (t) => {
  const site = getSite({
    src: "icons",
  });

  site.data("sprite", true);
  site.use(icons({ file: "/icons.svg" }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
