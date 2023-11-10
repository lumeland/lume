import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import metas from "../plugins/metas.ts";

import type { Page } from "../core/file.ts";

Deno.test("metas plugin", async (t) => {
  const site = getSite({
    src: "metas",
  });

  site.use(metas());
  site.preprocess([".md"], (page: Page) => {
    page.data.excerpt ??= (page.data.content as string).split("<!--more-->")[0];
  });

  await build(site);
  await assertSiteSnapshot(t, site);
});
