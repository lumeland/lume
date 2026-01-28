import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import extractOrder from "../plugins/extract_order.ts";

Deno.test("extract_order plugin", async (t) => {
  const site = getSite({
    src: "extract_order",
  });

  site.use(extractOrder());

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("extract_order plugin (cascade mode)", async (t) => {
  const site = getSite({
    src: "extract_order",
  });

  site.use(extractOrder({
    cascade: true,
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("extract_order plugin (keep basename)", async (t) => {
  const site = getSite({
    src: "extract_order",
  });

  site.use(extractOrder({
    remove: false,
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
