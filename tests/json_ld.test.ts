import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import jsonLd from "../plugins/json_ld.ts";

Deno.test("json_ld plugin", async (t) => {
  const site = getSite({
    src: "json_ld",
  });

  site.use(jsonLd());

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("json_ld plugin (no insert)", async (t) => {
  const site = getSite({
    src: "json_ld",
  });

  site.use(jsonLd({ insert: false }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
