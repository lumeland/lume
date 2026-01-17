import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import katex from "../plugins/katex.ts";

Deno.test("Katex plugin", async (t) => {
  const site = getSite({
    src: "katex",
  });

  site.use(katex({
    options: {
      macros: {
        "\\f": "#1f(#2)",
      },
    },
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("Katex plugin without assets", async (t) => {
  const site = getSite({
    src: "katex",
  });

  site.use(katex({
    cssFile: false,
    options: {
      macros: {
        "\\f": "#1f(#2)",
      },
    },
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
