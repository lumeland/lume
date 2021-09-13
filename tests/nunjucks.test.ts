import { assertStrictEquals as equals } from "../deps/assert.ts";
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

  await site.build();

  testPage(site, "/index", (page) => {
    equals(page.data.title, "Hello World");
    equals(page.data.url, "/");
    equals(
      page.document?.querySelector("h1")?.innerText,
      page.data.title + " (async)",
    );
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
});
