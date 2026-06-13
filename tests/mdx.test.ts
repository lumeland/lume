import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import mdx from "../plugins/mdx.ts";
import jsx, { JSXPluginData } from "../plugins/jsx.ts";
import { Data } from "../core/file.ts";
import { PaginatePluginData } from "../plugins/paginate.ts";
import { SearchPluginData } from "../plugins/search.ts";

interface TestData extends Data, JSXPluginData, PaginatePluginData, SearchPluginData<TestData> {}

Deno.test("Build a mdx site", async (t) => {
  const site = getSite<TestData>({
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
