import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import mdx from "../plugins/mdx.ts";
import jsx from "../plugins/jsx.ts";

Deno.test("Build a mdx site", async (t) => {
  const site = getSite({
    src: "mdx",
  });

  const plugin = () => {
    // deno-lint-ignore no-explicit-any
    return (tree: any) => {
      tree.children.push({
        type: "element",
        tagName: "div",
        properties: { style: "background-color: orange;" },
        children: [{ type: "text", value: "Hello, World!" }],
      });
    };
  };

  site.use(jsx());
  site.use(mdx({ rehypePlugins: [plugin] }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
