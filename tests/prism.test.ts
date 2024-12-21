import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import prism from "../plugins/prism.ts";
import "npm:prismjs@1.29.0/components/prism-less.js";

Deno.test("Prism plugin with path", async (t) => {
  const site = getSite({
    src: "prism",
  });

  site.use(prism({
    theme: {
      name: "dark",
      path: "_includes/code-theme.css",
    },
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("Prism plugin", async (t) => {
  const site = getSite({
    src: "prism",
  });

  site.use(prism({
    theme: {
      name: "dark",
      cssFile: "styles.css",
    },
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
