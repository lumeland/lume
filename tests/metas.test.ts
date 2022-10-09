import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import metas from "../plugins/metas.ts";

Deno.test("metas plugin", async (t) => {
  const site = getSite({
    src: "metas",
  });

  site.use(metas());

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("metas plugin use defaultPageData", async (t) => {
  const site = getSite({
    src: "metas",
  });

  // todo should page data value  override _data value?
  site.ignore("_data.yml");

  site.use(metas({
    defaultPageData: {
      title: "title",
      robots: "robots",
      description: "description",
    },
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
