import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import validateHtml from "../src/mod.ts";

describe("validate-html plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    const result: { url: string; messages: string[] }[] = [];

    site.use(
      validateHtml({
        output(reports) {
          for (const report of reports.results) {
            result.push({
              url: report.filePath!,
              messages: report.messages.map((msg) => msg.ruleId),
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
