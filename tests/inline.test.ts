import { assert, assertStrictEquals as equals } from "../deps/assert.ts";
import { build, getSite, testPage } from "./utils.ts";
import inline from "../plugins/inline.ts";
import binaryLoader from "../core/loaders/binary.ts";
import { Page } from "../core.ts";

Deno.test("code_hightlight plugin", async () => {
  const site = getSite({
    src: "inline",
  });

  site.use(inline());
  site.loadAssets([".svg", ".js"]);
  site.loadAssets([".png"], binaryLoader);
  site.copy("favicon.png", "favicon2.png");
  await build(site);

  testPage(site, "/styles.css", (page) => {
    equals(page.data.url, "/styles.css");
  });

  testPage(site, "/index", (page) => {
    assert(!inlined(page, "el-1", "href"));
    equals(page.document?.querySelector("#el-1 + style")?.tagName, "STYLE");
    assert(inlined(page, "el-3", "href"));
    assert(!inlined(page, "el-4", "href"));
    assert(inlined(page, "el-5", "href"));
    assert(!inlined(page, "el-6", "href"));
    equals(page.document?.querySelector("#el-7")?.tagName, "SVG");
    equals(page.document?.querySelector("#el-7")?.className, "has-svg");
    assert(!inlined(page, "el-8", "src"));
    assert(inlined(page, "el-9", "src"));
    assert(!inlined(page, "el-10", "src"));
    assert(!inlinedScript(page, "el-11"));
    assert(inlinedScript(page, "el-12"));
    assert(inlinedScript(page, "el-13"));
  });
});

function inlined(page: Page, id: string, attr: string) {
  const href = page.document?.getElementById(id)?.getAttribute(attr);

  return href && href.startsWith("data:");
}

function inlinedScript(page: Page, id: string) {
  return page.document?.getElementById(id)?.innerHTML !== "";
}
