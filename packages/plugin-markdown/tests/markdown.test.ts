import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import footnotePlugin from "markdown-it-footnote";

describe("Markdown plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite(
      {
        cwd: import.meta.resolve("./assets"),
        location: new URL("https://example.com/blog"),
      },
      {
        markdown: {
          // @ts-expect-error: footnote use markdown-it@14
          plugins: [footnotePlugin],
          rules: {
            footnote_block_open: () =>
              '<h4 class="mt-3">Footnotes</h4>\n' +
              '<section class="footnotes">\n' +
              '<ol class="footnotes-list">\n',
          },
        },
      },
    );

    expect(await build(site)).toMatchSnapshot();
  });

  it("markdown with hooks", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
      location: new URL("https://example.com/blog"),
    });

    site.hooks.addMarkdownItPlugin(footnotePlugin);
    site.hooks.addMarkdownItRule(
      "footnote_block_open",
      () =>
        '<h4 class="mt-3">Footnotes</h4>\n' +
        '<section class="footnotes">\n' +
        '<ol class="footnotes-list">\n',
    );

    expect(await build(site)).toMatchSnapshot();
  });
});
