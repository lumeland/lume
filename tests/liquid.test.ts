import { assert, assertStrictEquals as equals } from "../deps/assert.ts";
import { build, getSite, pageExists, testPage } from "./utils.ts";
import liquid from "../plugins/liquid.ts";

Deno.test("build a site with liquid", async () => {
  const site = getSite({
    src: "liquid",
    location: new URL("https://example.com/blog"),
  });

  site.use(liquid());

  // Register an async filter
  site.filter(
    "returnAsync",
    (text) =>
      new Promise((resolve) =>
        setTimeout(() => resolve(`${text} (async)`), 10)
      ),
    true,
  );

  // Register custom tags
  site.helper(
    "upperCase",
    (text) => `<strong>${(text as string).toUpperCase()}</strong>`,
    { type: "tag" },
  );
  site.helper(
    "upperCaseAsync",
    (text) =>
      Promise.resolve(`<strong>${(text as string).toUpperCase()}</strong>`),
    { type: "tag", async: true },
  );

  await build(site);

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

  testPage(site, "/liquid-filter", (page) => {
    equals(page.data.url, "/liquid-filter/");
    equals(
      page.document?.querySelector("h1")?.innerText,
      "LIQUID FILTER EXAMPLE",
    );
  });

  assert(pageExists(site, "/empty") === false);

  testPage(site, "/with-helpers", (page) => {
    equals(page.document?.querySelectorAll("p").length, 4);
    equals(page.data.title, "The title");
    page.document?.querySelectorAll("p").forEach((p) => {
      // @ts-ignore: innerText doesn't exist on Node
      equals(p.innerText, page.data.title.toUpperCase());
    });

    const div = page.document?.querySelector("div");
    equals(div?.innerText, "hello (async)");

    const lis = page.document?.querySelectorAll("li");
    equals(lis?.length, 4);
    // @ts-ignore: innerText doesn't exist on Node
    equals(lis.item(0)?.innerHTML, "This is a partial");
    // @ts-ignore: innerText doesn't exist on Node
    equals(lis.item(1)?.innerHTML, "async helper in a partial (async)");
  });
});
