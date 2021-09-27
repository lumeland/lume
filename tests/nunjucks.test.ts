import { assert, assertStrictEquals as equals } from "../deps/assert.ts";
import { getSite, testPage } from "./utils.ts";

Deno.test("build a site with nunjucks", async () => {
  const site = getSite({
    test: true,
    src: "nunjucks",
    location: new URL("https://example.com/blog"),
  });

  // Register an async filter
  site.filter(
    "returnAsync",
    (text) =>
      new Promise((resolve) =>
        setTimeout(() => resolve(`${text} (async)`), 10)
      ),
    true,
  );

  // Register custom helpers
  site.helper(
    "upperCase",
    (text) => `<strong>${(text as string).toUpperCase()}</strong>`,
    { type: "tag" },
  );
  site.helper(
    "upperCaseBody",
    (text) => `<strong>${(text as string).toUpperCase()}</strong>`,
    { type: "tag", body: true },
  );
  site.helper(
    "upperCaseAsync",
    (text) =>
      Promise.resolve(`<strong>${(text as string).toUpperCase()}</strong>`),
    { type: "tag", async: true },
  );
  site.helper(
    "upperCaseBodyAsync",
    (text) =>
      Promise.resolve(`<strong>${(text as string).toUpperCase()}</strong>`),
    { type: "tag", body: true, async: true },
  );

  await site.build();

  testPage(site, "/index", (page) => {
    equals(page.data.title, "Hello World");
    equals(page.data.url, "/");
    equals(page.document?.querySelector("h1")?.innerText, page.data.title);
    equals(page.document?.querySelector("title")?.innerText, page.data.title);
  });

  testPage(site, "/data.json", (page) => {
    equals(page.data.url, "/data.json");
    equals(page.dest.path, "/data");
    equals(page.dest.ext, ".json");

    const data = JSON.parse(page.content as string);
    equals(data.length, 3);
    equals(data[0], "red");
    equals(data[1], "green");
    equals(data[2], "blue");
  });

  testPage(site, "/njk-filter", (page) => {
    equals(page.data.url, "/njk-filter/");
    equals(page.document?.querySelector("h1")?.innerText, "NJK FILTER EXAMPLE");
  });

  testPage(site, "/empty", (page) => {
    assert(!page.document);
  });

  testPage(site, "/with-helpers", (page) => {
    equals(page.document?.querySelectorAll("p").length, 8);
    equals(page.data.title, "The title");
    page.document?.querySelectorAll("p").forEach((p) => {
      // @ts-ignore: innerText doesn't exist on Node
      equals(p.innerText, page.data.title.toUpperCase());
    });

    const div = page.document?.querySelector("div");
    equals(div?.innerText, "hello (async)");
  });
});
