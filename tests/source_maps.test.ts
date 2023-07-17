import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import sass from "../plugins/sass.ts";
import postcss from "../plugins/postcss.ts";
import lightningcss from "../plugins/lightningcss.ts";
import sourceMaps from "../plugins/source_maps.ts";
import esbuild from "../plugins/esbuild.ts";
import terser from "../plugins/terser.ts";

Deno.test("Source maps from CSS files", async (t) => {
  const site = getSite({
    src: "sass",
  });

  site.use(sass());
  site.use(postcss());
  site.use(lightningcss({
    includes: false,
  }));
  site.use(sourceMaps());

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("Source maps from Js files", async (t) => {
  const site = getSite({
    src: "esbuild",
  });

  site.use(esbuild());
  site.use(terser());
  site.use(sourceMaps());

  await build(site);
  await assertSiteSnapshot(t, site);
});
