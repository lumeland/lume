import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import mdx from "../plugins/mdx.ts";
import jsx from "../plugins/jsx_preact.ts";

Deno.test("Build a mdx site", async (t) => {
  const site = getSite({
    src: "mdx",
  });

  site.use(jsx());
  site.use(mdx({
    pragma: "/** @jsxImportSource https://esm.sh/preact */",
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
