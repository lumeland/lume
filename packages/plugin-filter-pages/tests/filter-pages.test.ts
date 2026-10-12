import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import filterPages from "../src/mod.ts";

describe("filter-pages plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(
      filterPages({
        fn(page) {
          return page.data.url.startsWith("/multiple/");
        },
      }),
    );

    expect(await build(site)).toMatchSnapshot();
  });
});
