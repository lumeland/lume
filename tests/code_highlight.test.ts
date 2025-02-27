import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import codeHighlight from "../plugins/code_highlight.ts";

Deno.test("code_hightlight plugin with default css file", async (t) => {
  const site = getSite({
    src: "code_highlight",
  });

  site.use(codeHighlight({
    theme: {
      name: "a11y-dark",
    },
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("code_hightlight plugin", async (t) => {
  const site = getSite({
    src: "code_highlight",
  });

  site.use(codeHighlight({
    theme: {
      name: "a11y-dark",
      cssFile: "theme.css",
    },
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
