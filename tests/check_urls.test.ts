import { build, getSite } from "./utils.ts";
import { assertSnapshot } from "../deps/snapshot.ts";
import checkUrls from "../plugins/check_urls.ts";

Deno.test("check_urls plugin", async (t) => {
  const site = getSite({
    src: "check_urls",
  });

  const result: { url: string; pages: string[] }[] = [];

  site.use(checkUrls({
    output(data) {
      for (const [url, pages] of data) {
        result.push({
          url,
          pages: Array.from(pages),
        });
      }
    },
  }));

  await build(site);
  result.sort((a, b) => a.url.localeCompare(b.url));
  await assertSnapshot(t, result);
});

Deno.test("check_urls plugin (strict mode)", async (t) => {
  const site = getSite({
    src: "check_urls",
  });

  const result: { url: string; pages: string[] }[] = [];

  site.use(checkUrls({
    output(data) {
      for (const [url, pages] of data) {
        result.push({
          url,
          pages: Array.from(pages),
        });
      }
    },
    strict: true,
  }));

  await build(site);
  result.sort((a, b) => a.url.localeCompare(b.url));
  await assertSnapshot(t, result);
});

Deno.test("check_urls plugin (anchor mode)", async (t) => {
  const site = getSite(
    {
      src: "check_urls",
      dest: "check_urls/_site",
    },
    {},
    true,
  );

  const result: { url: string; pages: string[] }[] = [];

  site.use(checkUrls({
    output(data) {
      for (const [url, pages] of data) {
        result.push({
          url,
          pages: Array.from(pages),
        });
      }
    },
    anchors: true,
  }));

  await build(site);
  result.sort((a, b) => a.url.localeCompare(b.url));
  await assertSnapshot(t, result);
});
