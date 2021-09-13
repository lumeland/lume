import { assertStrictEquals as equals } from "../deps/assert.ts";
import { relativeUrl } from "../plugins/relative_urls.ts";

Deno.test("relative_url function", () => {
  equals(relativeUrl("/blog/", "/blog/", "/about-us/"), "about-us/");
  equals(relativeUrl("/blog/", "/blog/", "/blog/about-us"), "about-us");
  equals(relativeUrl("/blog/", "/blog/", "/blog/about-us/"), "about-us/");
  equals(relativeUrl("/", "/blog/", "/blog/about-us/"), "about-us/");
  equals(relativeUrl("/", "/", "/blog/about-us/"), "blog/about-us/");
  equals(
    relativeUrl(
      "/blog/",
      "/blog/about-us/contact/",
      "/blog/about-us/presentation/",
    ),
    "../presentation/",
  );
  equals(
    relativeUrl(
      "/blog/",
      "/blog/about-us/contact",
      "/blog/about-us/presentation/",
    ),
    "../presentation/",
  );
  equals(
    relativeUrl(
      "/blog/",
      "/blog/about-us/contact/index.html",
      "/blog/about-us/presentation/",
    ),
    "../../presentation/",
  );
});
