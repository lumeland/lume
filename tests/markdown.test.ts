import { assert, assertStrictEquals as equals } from "../deps/assert.ts";
import { getSite, testPage } from "./utils.ts";

Deno.test("build a markdown site", async () => {
  const site = getSite({
    test: true,
    dev: true,
    src: "markdown",
    location: new URL("https://example.com/blog"),
  });

  await site.build();

  testPage(site, "/basic", (page) => {
    equals(page.document?.querySelectorAll("li").length, 3);
  });

  testPage(site, "/with-nunjucks", (page) => {
    equals(page.document?.querySelectorAll("li").length, 3);
    equals(
      page.document?.querySelector("li")?.innerHTML,
      'one: <a href="/items/un.html">un</a>',
    );
  });

  testPage(site, "/with-attributes", (page) => {
    const el = page.document?.querySelector("a");
    equals(el?.getAttribute("href"), "#foo");
    equals(el?.getAttribute("target"), "_blank");
  });

  testPage(site, "/with-deflist", (page) => {
    equals(page.document?.querySelectorAll("dl")?.length, 1);
    equals(page.document?.querySelectorAll("dt")?.length, 2);
    equals(page.document?.querySelectorAll("dd")?.length, 3);
  });

  testPage(site, "/with-code", (page) => {
    const codes = page.document?.querySelectorAll("code");
    equals(codes?.length, 2);
    // @ts-ignore getAttribute does not exist on Node
    equals(codes?.item(0)?.getAttribute("class"), "language-html");
    equals(page.document?.querySelectorAll("pre")?.length, 2);
  });

  testPage(site, "/empty", (page) => {
    assert(!page.document);
  });

  testPage(site, "/with-module", (page) => {
    equals(page.document?.querySelectorAll("h1").length, 1);
    equals(page.document?.querySelector("h1")?.innerText, page.data.title);
    equals(page.document?.querySelector("a")?.getAttribute("href"), "/");
  });

  testPage(site, "/with-filter", (page) => {
    equals(page.document?.querySelectorAll("p").length, 1);
    equals(
      page.document?.querySelector("h1")?.innerHTML,
      "Module <strong>example</strong>",
    );
    equals(page.document?.querySelector("a")?.getAttribute("href"), "/");
  });
});
