import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import prism from "../plugins/prism.ts";

Deno.test("Prism plugin", async (t) => {
  const site = getSite({
    src: "prism",
  });

  site.use(prism({
    languages: ["css", "less", "html", "js"],
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
