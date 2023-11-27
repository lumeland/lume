import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import unocss from "../plugins/unocss.ts";

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
    cssFileTransformers: [],
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("Unocss plugin (with transformers)", async (t) => {
  const site = getSite({
    src: "unocss",
  });

  site.use(unocss({
    cssFile: "styles.css",
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
