import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import toc, { linkInsideHeader } from "../plugins/toc.ts";

Deno.test("toc plugin", async (t) => {
  const site = getSite({
    src: "toc",
  });

  site.use(toc());

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("toc plugin (linkInsideHeader)", async (t) => {
  const site = getSite({
    src: "toc",
  });

  site.use(toc({
    minLevel: 1,
    tabIndex: false,
    anchor: linkInsideHeader({
      content: "¶",
    }),
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
