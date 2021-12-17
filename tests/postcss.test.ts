import { assert, assertStrictEquals as equals } from "../deps/assert.ts";
import { build, getSite, testPage } from "./utils.ts";
import postcss from "../plugins/postcss.ts";

Deno.test("postcss plugin", async () => {
  const site = getSite({
    src: "postcss",
  });

  site.use(postcss());

  await build(site);

  equals(site.pages.length, 2);

  const assetLoaders = new Map(site.assetLoader.loaders.entries);

  // Register the .css loader
  assert(assetLoaders.has(".css"));

  testPage(site, "/index", (page) => {
    equals(page.data.url, "/index.css");
    equals(
      page.content,
      `::root {
  --color: #333;
  --background: #fff;
  --font-family: sans-serif;
}
.text {
  font-family: var(--font-family)
}
.text p {
    color: var(--color);
    box-shadow: 0 0 0.5em var(--background);
    -webkit-backface-visibility: hidden;
            backface-visibility: hidden;
  }
`,
    );
  });
});

Deno.test("postcss plugin without includes", async () => {
  const site = getSite({
    src: "postcss",
  });

  site.use(postcss({
    includes: false,
  }));

  await build(site);

  testPage(site, "/index", (page) => {
    equals(page.data.url, "/index.css");
    equals(
      page.content,
      `@import "variables.css";
@import "./text.css";
`,
    );
  });
});
