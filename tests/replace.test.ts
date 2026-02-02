import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import replace from "../plugins/replace.ts";

Deno.test("replace plugin", async (t) => {
  const site = getSite({
    src: "replace",
  });

  site.use(replace({
    replacements: {
      "Lume": (text: string) => text.toUpperCase(),
      "static site generator": "awesome static site generator",
    },
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
