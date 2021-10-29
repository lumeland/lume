import { assertStrictEquals as equals } from "../deps/assert.ts";
import { build, getSite, testPage } from "./utils.ts";
import pug from "../plugins/pug.ts";

Deno.test("build a site with eta", async () => {
  const site = getSite({
    src: "pug",
    location: new URL("https://example.com/blog"),
  });

  site.use(pug());

  await build(site);

  testPage(site, "/extends", (page) => {
    equals(page.data.title, "Pug example");
    equals(page.data.url, "/extends/");
    equals(page.document?.querySelector("h1")?.innerText, "Home");
    equals(page.document?.querySelector("title")?.innerText, page.data.title);
  });

  testPage(site, "/filter", (page) => {
    equals(page.data.title, "Markdown content");
    equals(page.data.url, "/article.html");
    equals(page.document?.querySelector("h1")?.innerText, "This is a title");
    equals(page.document?.querySelectorAll("li")?.length, 2);
  });
});
