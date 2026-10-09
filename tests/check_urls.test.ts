import { build, getSite } from "./utils.ts";
import { assertSnapshot } from "../deps/snapshot.ts";
import { assertEquals } from "../deps/assert.ts";
import { join } from "../deps/path.ts";
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

Deno.test("check_urls plugin (non-ascii url)", async () => {
  const site = getSite({
    src: "check_urls_non_ascii",
    dest: "tmp",
  });
  const broken: string[] = [];

  site.use(checkUrls({
    output(data) {
      for (const [url] of data) {
        broken.push(url);
      }
    },
  }));

  // The TestWriter doesn't write to disk, so create the built page that the
  // non-ascii link points to.
  const dest = site.dest();

  try {
    await Deno.mkdir(join(dest, "página"), { recursive: true });
    await Deno.writeTextFile(join(dest, "página", "index.html"), "hi");

    await build(site);
    assertEquals(broken, []);
  } finally {
    await Deno.remove(dest, { recursive: true });
  }
});
