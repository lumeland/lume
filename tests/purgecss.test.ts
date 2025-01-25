import { assertSiteSnapshot, build, getPath, getSite } from "./utils.ts";
import { normalizePath } from "../core/utils/path.ts";
import purgecss from "../plugins/purgecss.ts";

Deno.test("purgecss plugin", async (t) => {
  const site = getSite({
    src: "purgecss",
  });

  site.loadAssets([".css", ".js"]);
  site.add("static", ".");

  site.use(purgecss());

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("purgecss plugin with options", async (t) => {
  const site = getSite({
    src: "purgecss",
  });

  site.loadAssets([".css", ".js"]);
  site.add("static", ".");

  site.use(purgecss({
    options: {
      content: [
        normalizePath(getPath("./assets/purgecss/static/**/*.html")),
        {
          raw: '<img id="img-option" src="">',
          extension: "html",
        },
      ],
      safelist: ["unused"],
      blocklist: ["strong"],
      variables: true,
    },
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
