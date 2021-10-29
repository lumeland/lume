import { assertStrictEquals as equals } from "../deps/assert.ts";
import { getSite, testPage } from "./utils.ts";
import jsx from "../plugins/jsx.ts";

Deno.test("build a site with jsx/tsx modules", async () => {
  const site = getSite({
    src: "jsx",
    location: new URL("https://example.com/blog"),
  });

  site.use(jsx());
  await site.build();

  testPage(site, "/index", (page) => {
    equals(page.data.url, "/");
    equals(page.data.title, "This is the title");
    equals(page.document?.querySelector("h1")?.innerText, "Hello world");
    equals(page.document?.querySelector("p")?.innerText, "This is a JSX page");
    equals(page.document?.querySelector("title")?.innerText, page.data.title);
  });

  testPage(site, "/with-function", (page) => {
    equals(page.data.url, "/with-function/");
    equals(page.data.title, "This is the title");
    equals(page.document?.querySelector("h1")?.innerText, page.data.title);
    equals(page.document?.querySelector("title")?.innerText, page.data.title);
    equals(page.document?.querySelector("a")?.getAttribute("href"), "/blog/");
  });

  testPage(site, "/with-markdown", (page) => {
    equals(page.data.url, "/with-markdown/");
    equals(page.data.title, "Markdown combined with JSX");
    equals(page.document?.querySelector("h1")?.innerText, "Hello world");
    equals(page.document?.querySelector("title")?.innerText, page.data.title);
    equals(page.document?.querySelector("a")?.getAttribute("href"), "/");
  });

  testPage(site, "/multiple[0]", (page) => {
    equals(page.data.url, "/page/1");
    equals(page.document?.querySelector("div")?.innerText, "1");
  });

  testPage(site, "/multiple[1]", (page) => {
    equals(page.data.url, "/page/2");
    equals(page.document?.querySelector("div")?.innerText, "2");
  });
});
