import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import unocss from "../plugins/unocss.ts";

Deno.test("Unocss plugin", async (t) => {
  const site = getSite({
    src: "unocss",
  });

  site.use(unocss({
    cssFile: false,
    transformers: [],
    reset: "tailwind",
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
    transformers: [],
    reset: "tailwind",
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("Unocss plugin (with transformers)", async (t) => {
  const site = getSite({
    src: "unocss",
  });

  site.add("styles.css");
  site.use(unocss({
    cssFile: "styles.css",
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("Unocss with placeholder", async (t) => {
  const site = getSite({
    src: "unocss",
  });

  site.add([".css"]);
  site.use(unocss({
    cssFile: "styles.css",
    placeholder: "/* unocss-placeholder */",
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
