import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import SEO from "../src/mod.ts";

describe("seo plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    const result: { url: string; messages: string[] }[] = [];

    site.use(
      SEO({
        output(reports) {
          for (const [url, messages] of reports.entries()) {
            result.push({
              url,
              messages: messages.map((msg) => (typeof msg === "string" ? msg : msg.msg)),
            });
          }
        },
      }),
    );

    await build(site);
    result.sort((a, b) => a.url.localeCompare(b.url));
    expect(result).toMatchSnapshot();
  });
});
