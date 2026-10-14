import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import checkUrls from "../src/mod.ts";

describe("check-urls plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    const result: { url: string; pages: string[] }[] = [];

    site.use(
      checkUrls({
        output(data) {
          for (const [url, pages] of data) {
            result.push({
              url,
              pages: Array.from(pages),
            });
          }
        },
      }),
    );

    await build(site);
    result.sort((a, b) => a.url.localeCompare(b.url));
    expect(result).toMatchSnapshot();
  });

  it("should match site snapshot in strict mode", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    const result: { url: string; pages: string[] }[] = [];

    site.use(
      checkUrls({
        output(data) {
          for (const [url, pages] of data) {
            result.push({
              url,
              pages: Array.from(pages),
            });
          }
        },
        strict: true,
      }),
    );

    await build(site);
    result.sort((a, b) => a.url.localeCompare(b.url));
    expect(result).toMatchSnapshot();
  });

  it("should match site snapshot in anchors mode", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    const result: { url: string; pages: string[] }[] = [];

    site.use(
      checkUrls({
        output(data) {
          for (const [url, pages] of data) {
            result.push({
              url,
              pages: Array.from(pages),
            });
          }
        },
        anchors: true,
      }),
    );

    await build(site);
    result.sort((a, b) => a.url.localeCompare(b.url));
    expect(result).toMatchSnapshot();
  });
});
