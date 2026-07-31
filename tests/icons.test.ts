import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import icons from "../plugins/icons.ts";

Deno.test("icons plugin", async (t) => {
  const site = getSite({
    src: "icons",
  });

  site.use(icons());
  site.ignore("mingcute.vto");

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("icons plugin (old versions)", async (t) => {
  const site = getSite({
    src: "icons",
  });

  site.use(icons({
    versions: {
      mingcute: 2,
    },
  }));
  site.ignore("index.vto");

  await build(site);
  await assertSiteSnapshot(t, site);
});
