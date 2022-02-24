import { assert, assertStrictEquals as equals } from "../deps/assert.ts";
import { build, getSite, testPage } from "./utils.ts";
import parcelCss from "../plugins/parcel_css.ts";

Deno.test("parcelCSS plugin", async () => {
  const site = getSite({
    src: "parcel_css",
  });

  site.use(parcelCss());

  await build(site);

  equals(site.pages.length, 2);

  const { formats } = site;

  // Register the .css loader
  assert(formats.has(".css"));
  equals(formats.get(".css")?.pageType, "asset");

  testPage(site, "/index", (page) => {
    equals(page.data.url, "/index.css");
    const content = page.content as string;
    equals(
      content,
      '@import "variables.css";@import "./text.css";',
    );
  });

  testPage(site, "/text", (page) => {
    equals(page.data.url, "/text.css");
    const content = page.content as string;
    equals(
      content,
      ".text{font-family:var(--font-family)}.text p{color:var(--color);box-shadow:0 0 .5em var(--background);-webkit-backface-visibility:hidden;backface-visibility:hidden}",
    );
  });
});
