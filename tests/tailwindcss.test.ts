import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import tailwindcss from "../plugins/tailwindcss.ts";

Deno.test("Tailwindcss plugin", async (t) => {
  const site = getSite({
    src: "tailwindcss",
  });

  site.use(tailwindcss({
    optimize: false,
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
