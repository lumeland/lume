import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import pagefind from "../src/mod.ts";

describe("pagefind plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(pagefind());

    const result = await build(site);

    // Don't add the pagefind content to the snapshot
    result.pages.forEach((page) => {
      if (page.data.url.startsWith("/pagefind/")) {
        page.content = page.content.length ? "yes" : "no";
        page.data.content = page.data.content.length ? "yes" : "no";
      }
    });

    expect(result).toMatchSnapshot();
  });
});
