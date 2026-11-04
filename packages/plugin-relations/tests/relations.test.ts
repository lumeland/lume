import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import relations from "../src/mod.ts";

describe("relations plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(
      relations({
        foreignKeys: {
          post: "post_id",
          category: { foreignKey: "category_id", idKey: "basename" },
          comment: { foreignKey: "comment_id", pluralRelationKey: "comments" },
        },
      }),
    );

    expect(await build(site)).toMatchSnapshot();
  });
});
