import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import unocss from "../plugins/unocss.ts";
// https://github.com/denoland/deno/issues/19096
import transformerVariantGroupImport from "npm:@unocss/transformer-variant-group@0.57.7";
import transformerDirectivesImport from "npm:@unocss/transformer-directives@0.57.7";

Deno.test("Unocss plugin", async (t) => {
  const site = getSite({
    src: "unocss",
  });

  site.use(unocss({
    cssFileTransformers: [],
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("Unocss plugin (css file)", async (t) => {
  const site = getSite({
    src: "unocss",
  });

  site.use(unocss({
    cssFile: "styles.css",
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("Unocss plugin (with transformers)", async (t) => {
  // https://github.com/denoland/deno/issues/16458#issuecomment-1295003089
  const transformerVariantGroup =
    transformerVariantGroupImport as unknown as typeof transformerVariantGroupImport.default;
  const transformerDirectives =
    transformerDirectivesImport as unknown as typeof transformerDirectivesImport.default;

  const site = getSite({
    src: "unocss",
  });

  site.use(unocss({
    cssFile: "styles.css",
    cssFileTransformers: [
      transformerVariantGroup(),
      transformerDirectives(),
    ],
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
