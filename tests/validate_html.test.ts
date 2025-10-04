import { build, getSite } from "./utils.ts";
import { assertSnapshot } from "../deps/snapshot.ts";
import validateHtml from "../plugins/validate_html.ts";

Deno.test("validate HTML plugin", async (t) => {
  const site = getSite({
    src: "validate_html",
  });

  const result: { url: string; messages: string[] }[] = [];

  site.use(validateHtml({
    output(reports) {
      for (const report of reports.results) {
        result.push({
          url: report.filePath!,
          messages: report.messages.map((msg) => msg.ruleId),
        });
      }
    },
  }));

  await build(site);
  result.sort((a, b) => a.url.localeCompare(b.url));
  await assertSnapshot(t, result);
});
