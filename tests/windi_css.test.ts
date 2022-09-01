import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import windiCSS from "../plugins/windi_css.ts";

Deno.test("Windi CSS plugin", async (t) => {
  const site = getSite({
    src: "windi_css",
  });

  site.use(windiCSS({
    config: {
      shortcuts: {
        "btn-green": "text-white bg-green-500 hover:bg-green-700",
      },
    },
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
