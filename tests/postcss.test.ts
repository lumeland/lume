import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import { assert } from "../deps/assert.ts";
import postcss from "../plugins/postcss.ts";
import nano from "npm:cssnano";

Deno.test("Postcss plugin", async (t) => {
  const site = getSite({
    src: "postcss",
  });

  site.add([".css"]);
  site.use(postcss());

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("Postcss plugin (without includes)", async (t) => {
  const site = getSite({
    src: "postcss",
  });
  site.add(".");
  site.use(postcss({
    includes: false,
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("postcss plugin with hooks", async (t) => {
  const site = getSite({
    src: "postcss",
  });

  site.add("/index.min.css");
  site.use(postcss());
  site.hooks.addPostcssPlugin(nano());

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("postcss plugin with default name", () => {
  const site = getSite({
    src: "postcss",
  });

  site.use(postcss());

  const { helpers } = site.renderer;

  assert(helpers.has("postcss"));
});

Deno.test("postcss plugin with copy()", async (t) => {
  const site = getSite({
    src: "postcss",
  });

  site.copy([".css"]);
  site.copy("index.min.css", "new.css");
  site.use(postcss());

  await build(site);
  await assertSiteSnapshot(t, site);
});
