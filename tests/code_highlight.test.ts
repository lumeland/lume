import { assertStrictEquals as equals } from "../deps/assert.ts";
import { getSite, testPage } from "./utils.ts";
import codeHighlight from "../plugins/code_highlight.ts";
import { Page } from "../core.ts";

Deno.test("code_hightlight plugin", async () => {
  const site = getSite({
    src: "code_highlight",
  });

  site.use(codeHighlight());
  await site.build();

  testPage(site, "/index", (page) => {
    equals(page.document?.querySelectorAll("pre code").length, 3);
    equals(
      getClass(page, "pre code.language-html"),
      "language-html hljs language-xml",
    );
    equals(getClass(page, "pre + pre code"), null);
    equals(getClass(page, "pre code.language-css"), "language-css hljs");
  });

  testPage(site, "/other", (page) => {
    equals(getClass(page, "body > pre"), null);
    equals(getClass(page, "body > code"), null);
    equals(getClass(page, "body > pre > code"), null);
    equals(getClass(page, "pre code.language-css"), "hljs language-css");
  });
});

function getClass(page: Page, selector: string) {
  return page.document?.querySelector(selector)?.getAttribute("class");
}
