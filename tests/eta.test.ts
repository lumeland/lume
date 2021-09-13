import { assertStrictEquals as equals } from "../deps/assert.ts";
import { build, getSite, testPage } from "./utils.ts";
import eta from "../plugins/eta.ts";

Deno.test("build a site with eta", async () => {
  const site = getSite({
    test: true,
    src: "eta",
    location: new URL("https://example.com/blog"),
  });

  site.use(eta());

  await build(site);

  testPage(site, "/index", (page) => {
    equals(page.data.title, "Eta example");
    equals(page.data.url, "/");
    equals(
      page.document?.querySelector("h1")?.innerText,
      "Timothy's Eta source code!",
    );
    equals(page.document?.querySelector("title")?.innerText, page.data.title);
    equals(
      page.document?.querySelector("footer")?.innerText,
      "This is a footer of Timothy",
    );
    equals(
      page.document?.querySelector("nav a")?.getAttribute("href"),
      "/blog/",
    );
  });
});
