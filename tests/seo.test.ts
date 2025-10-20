import { build, getSite } from "./utils.ts";
import { assertSnapshot } from "../deps/snapshot.ts";
import seo from "../plugins/seo.ts";

Deno.test("SEO plugin", async (t) => {
  const site = getSite({
    src: "seo",
  });

  const result: { url: string; messages: string[] }[] = [];

  site.use(seo({
    output(reports) {
      for (const [url, messages] of reports.entries()) {
        result.push({
          url,
          messages: messages.map((msg) =>
            typeof msg === "string" ? msg : msg.msg
          ),
        });
      }
    },
  }));

  await build(site);
  result.sort((a, b) => a.url.localeCompare(b.url));
  await assertSnapshot(t, result);
});
