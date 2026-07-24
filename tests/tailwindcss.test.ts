import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import tailwindcss from "../plugins/tailwindcss.ts";
import sourceMaps from "../plugins/source_maps.ts";

import type { PaginatePluginData } from "../plugins/paginate.ts";
import type { SearchPluginData } from "../plugins/search.ts";
import type { SourceMapsPluginData } from "../plugins/source_maps.ts";

interface TestData
  extends
    SourceMapsPluginData,
    PaginatePluginData,
    SearchPluginData<TestData> {}

Deno.test("Tailwindcss plugin", async (t) => {
  const site = getSite<TestData>({
    src: "tailwindcss",
  });

  site.add([".css"]);
  site.use(tailwindcss());

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("Tailwindcss plugin + minify", async (t) => {
  const site = getSite<TestData>({
    src: "tailwindcss",
  });

  site.add([".css"]);
  site.use(tailwindcss({
    minify: true,
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("Tailwindcss plugin + source maps", async (t) => {
  const site = getSite<TestData>({
    src: "tailwindcss",
  });

  site.add([".css"]);
  site.use(tailwindcss());
  site.use(sourceMaps());

  await build(site);
  await assertSiteSnapshot(t, site);
});
