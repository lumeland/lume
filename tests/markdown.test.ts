import { assert, assertStrictEquals as equals } from "../deps/assert.ts";
import { getPage, getSite } from "./utils.ts";

Deno.test("build a markdown site", async () => {
  const site = getSite({
    test: true,
    dev: true,
    src: "markdown",
    location: new URL("https://example.com/blog"),
  });

  await site.build();

  const basic = getPage(site, "/basic");
  equals(basic.document?.querySelectorAll("li").length, 3);

  const nunjucks = getPage(site, "/with-nunjucks");
  equals(nunjucks.document?.querySelectorAll("li").length, 3);
  equals(
    nunjucks.document?.querySelector("li")?.innerHTML,
    'one: <a href="/blog/items/un.html">un</a>',
  );

  const attributes = getPage(site, "/with-attributes");
  const el = attributes.document?.querySelector("a");
  equals(el?.getAttribute("href"), "#foo");
  equals(el?.getAttribute("target"), "_blank");

  const deflist = getPage(site, "/with-deflist");
  equals(deflist.document?.querySelectorAll("dl")?.length, 1);
  equals(deflist.document?.querySelectorAll("dt")?.length, 2);
  equals(deflist.document?.querySelectorAll("dd")?.length, 3);

  const code = getPage(site, "/with-code");
  const codes = code.document?.querySelectorAll("code");
  equals(codes?.length, 2);
  // @ts-ignore getAttribute does not exist on Node
  equals(codes?.item(0)?.getAttribute("class"), "language-html");
  equals(code.document?.querySelectorAll("pre")?.length, 2);

  const links = getPage(site, "/with-links");
  const anchors = links.document?.querySelectorAll("a");
  equals(anchors?.length, 7);
  // @ts-ignore getAttribute does not exist on Node
  equals(anchors?.item(0)?.getAttribute("href"), "/blog/bar");
  // @ts-ignore getAttribute does not exist on Node
  equals(anchors?.item(1)?.getAttribute("href"), "/blog/foo");
  // @ts-ignore getAttribute does not exist on Node
  equals(anchors?.item(2)?.getAttribute("href"), "./foo");
  // @ts-ignore getAttribute does not exist on Node
  equals(anchors?.item(3)?.getAttribute("href"), "../foo");
  // @ts-ignore getAttribute does not exist on Node
  equals(anchors?.item(4)?.getAttribute("href"), "#foo");
  // @ts-ignore getAttribute does not exist on Node
  equals(anchors?.item(5)?.getAttribute("href"), "?foo=bar");
  // @ts-ignore getAttribute does not exist on Node
  equals(anchors?.item(6)?.getAttribute("href"), "/blog/basic/");
});
