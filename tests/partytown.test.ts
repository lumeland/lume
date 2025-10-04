import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import partytown from "../plugins/partytown.ts";

Deno.test("partytown plugin", async (t) => {
  const site = getSite({
    src: "partytown",
  });

  site.use(partytown());

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("partytown plugin (debug mode)", async (t) => {
  const site = getSite({
    src: "partytown",
  });

  site.use(partytown({
    options: {
      debug: true,
    },
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
