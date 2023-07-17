import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import relations from "../plugins/relations.ts";

Deno.test("relations plugin", async (t) => {
  const site = getSite({
    src: "relations",
  });

  site.use(relations({
    foreignKeys: {
      post: "post_id",
      category: { foreignKey: "category_id", idKey: "slug" },
      comment: { foreignKey: "comment_id", pluralRelationKey: "comments" },
    },
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
