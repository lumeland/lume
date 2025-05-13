import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import tailwindcss from "../plugins/tailwindcss.ts";
import sourceMaps from "../plugins/source_maps.ts";

Deno.test("Tailwindcss plugin", async (t) => {
  const site = getSite({
    src: "tailwindcss",
  });

  site.add([".css"]);
  site.use(tailwindcss());

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("Tailwindcss plugin + source maps", async (t) => {
  const site = getSite({
    src: "tailwindcss",
  });

  site.add([".css"]);
  site.use(tailwindcss());
  site.use(sourceMaps());

  await build(site);
  await assertSiteSnapshot(t, site);
});
