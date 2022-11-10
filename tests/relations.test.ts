import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import relations from "../plugins/relations.ts";

Deno.test("relations plugin", async (t) => {
  const site = getSite({
    src: "relations",
  });

  site.use(relations({
    foreignKeys: {
      post: "post_id",
      category: ["category_id", "slug"],
      comment: "comment_id",
    },
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
