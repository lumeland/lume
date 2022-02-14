import { assert, assertStrictEquals as equals } from "../deps/assert.ts";
import { build, getSite, testPage } from "./utils.ts";
import sass from "../plugins/sass.ts";

Deno.test("sass plugin", async () => {
  const site = getSite({
    src: "sass",
  });

  site.use(sass());

  await build(site);

  equals(site.pages.length, 1);

  const { formats } = site;

  // Register the .scss loader
  assert(formats.has(".scss"));
  equals(formats.get(".scss")?.pageType, "asset");

  testPage(site, "/index", (page) => {
    equals(page.data.url, "/index.css");
    const content = page.content as string;
    equals(
      content.trim(),
      `body{font:100% Helvetica,sans-serif;color:#333}`,
    );
  });
});
