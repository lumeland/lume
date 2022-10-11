import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import metas from "../plugins/metas.ts";
import { Page } from "../core.ts";

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

  site.use(metas({
    defaultPageData: {
      title: "title",
      robots: "robots",
      image: "cover",
      description: "excerpt",
    },
  })).preprocess([".md"], (page: Page) => {
    page.data.excerpt ??= (page.data.content as string).split("<!--more-->")[0];
  });

  await build(site);
  await assertSiteSnapshot(t, site);
});
