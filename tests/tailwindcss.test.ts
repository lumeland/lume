import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import postcss from "../plugins/postcss.ts";
import tailwindcss from "../plugins/tailwindcss.ts";

Deno.test("postcss plugin", async (t) => {
  const site = getSite({
    src: "tailwindcss",
  });

  site.use(tailwindcss({
    extensions: [".html", ".js"],
  }));
  site.use(postcss());
  site.loadAssets([".js"]);

  await build(site);
  await assertSiteSnapshot(t, site);
});
