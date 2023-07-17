import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import footnotePlugin from "npm:markdown-it-footnote@3.0.3";

Deno.test("Build a markdown site", async (t) => {
  const site = getSite({
    src: "markdown",
    location: new URL("https://example.com/blog"),
  }, {
    markdown: {
      plugins: [footnotePlugin],
      keepDefaultPlugins: true,
      rules: {
        footnote_block_open: () => (
          '<h4 class="mt-3">Footnotes</h4>\n' +
          '<section class="footnotes">\n' +
          '<ol class="footnotes-list">\n'
        ),
      },
    },
  });

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("Build a markdown with hooks", async (t) => {
  const site = getSite({
    dev: true,
    src: "markdown",
    location: new URL("https://example.com/blog"),
  });

  site.hooks.addMarkdownItPlugin(footnotePlugin);
  site.hooks.addMarkdownItRule("footnote_block_open", () => (
    '<h4 class="mt-3">Footnotes</h4>\n' +
    '<section class="footnotes">\n' +
    '<ol class="footnotes-list">\n'
  ));

  await build(site);
  await assertSiteSnapshot(t, site);
});
