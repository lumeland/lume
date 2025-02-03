import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import tailwindcss from "../plugins/tailwindcss.ts";

Deno.test("Tailwindcss plugin", async (t) => {
  const site = getSite({
    src: "tailwindcss",
  });

  site.add([".css"]);
  site.use(tailwindcss());

  await build(site);
  await assertSiteSnapshot(t, site);
});
