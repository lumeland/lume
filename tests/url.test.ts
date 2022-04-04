import { assert, assertStrictEquals as equals } from "../deps/assert.ts";
import { getSite, testPage } from "./utils.ts";

Deno.test("url and htmlUrl update href", async () => {
  const site = getSite({
    dev: true,
    src: "url",
    location: new URL("https://example.com/test/"),
  });

  await site.build();

  testPage(site, "/default-filter", (page) => {
    equals(
      page.document?.querySelector("#url")?.getAttribute("href"),
      "https://example.com/test/url/",
    );

    // Test <template> element, which was not supported in the previous version of deno_dom
    const template = page.document?.querySelector("template");
    assert(template);
  });

  testPage(site, "/default-filter", (page) => {
    equals(
      page.document?.querySelector("#htmlUrl")?.getAttribute("href"),
      "https://example.com/test/htmlUrl/",
    );
  });
});

Deno.test("configure url and htmlUrl names", async () => {
  const site = getSite({
    dev: true,
    src: "url",
    location: new URL("https://example.com/"),
  }, {
    url: {
      names: {
        url: "urlify",
        htmlUrl: "htmlUrlify",
      },
    },
  });

  await site.build();

  testPage(site, "/renamed-filter", (page) => {
    equals(
      page.document?.querySelector("#urlify")?.getAttribute("href"),
      "https://example.com/urlify/",
    );
  });

  testPage(site, "/renamed-filter", (page) => {
    equals(
      page.document?.querySelector("#htmlUrlify")?.getAttribute("href"),
      "https://example.com/htmlUrlify/",
    );
  });
});
