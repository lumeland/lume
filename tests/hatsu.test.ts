import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import hatsu from "../plugins/hatsu.ts";

Deno.test("Hatsu plugin", async (t) => {
  const site = getSite({
    src: "normal",
    location: new URL("https://example.com/"),
  });

  site.use(
    hatsu({
      instance: new URL("https://hatsu.local"),
      matches: ["page"],
      wellKnown: false,
    }),
  );
  site.ignore("static.yml");

  // build page
  await build(site);

  // compare to snapshot
  await assertSiteSnapshot(t, site);
});
