import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import jsx from "@lumeland/plugin-jsx";
import mdx from "../src/mod.ts";

describe("mdx plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    // const plugin = () => {
    //   // deno-lint-ignore no-explicit-any
    //   return (tree: any) => {
    //     tree.children.push({
    //       type: "element",
    //       tagName: "div",
    //       properties: { style: "background-color: orange;" },
    //       children: [{ type: "text", value: "Hello, World!" }],
    //     });
    //   };
    // };

    site.use(jsx());
    site.use(mdx());

    expect(await build(site)).toMatchSnapshot();
  });
});
