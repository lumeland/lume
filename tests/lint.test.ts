import { assertEquals } from "../deps/assert.ts";
import plugins from "../lint.ts";

Deno.test("plugin-order linter", () => {
  const diagnostics = Deno.lint.runPlugin(
    plugins,
    "_config.ts",
    `
    import lume from "lume/mod.ts";
    import basePath from "lume/plugins/base_path.ts";
    import postcss from "lume/plugins/postcss.ts";
    import inline from "lume/plugins/inline.ts";
    import json_ld from "lume/plugins/json_ld.ts";
    
    const site = lume();

    site.use(postcss());
    site.use(json_ld());
    site.use(basePath());
    site.use(inline());

    export default site;
    `,
  );

  assertEquals(diagnostics.length, 1);
  const d = diagnostics[0];
  assertEquals(
    'Invalid order of plugins: "json_ld" should be used before "postcss"',
    d.message,
  );
});

Deno.test("plugin-order linter (other files)", () => {
  const diagnostics = Deno.lint.runPlugin(
    plugins,
    "foo.ts",
    `
    import lume from "lume/mod.ts";
    import basePath from "lume/plugins/base_path.ts";
    import postcss from "lume/plugins/postcss.ts";
    import inline from "lume/plugins/inline.ts";
    import json_ld from "lume/plugins/json_ld.ts";
    
    const site = lume();

    site.use(postcss());
    site.use(json_ld());
    site.use(basePath());
    site.use(inline());

    export default site;
    `,
  );

  assertEquals(diagnostics.length, 0);
});
