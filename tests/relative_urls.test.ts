import { assertStrictEquals as equals } from "../deps/assert.ts";
import { getSite, testPage } from "./utils.ts";
import relativeUrls from "../plugins/relative_urls.ts";
import { Element } from "../deps/dom.ts";
import { Page } from "../core.ts";

Deno.test("relative_url plugin", async () => {
  const site = getSite({
    test: true,
    src: "relative_urls",
    location: new URL("https://example.com/blog"),
  });

  site.use(relativeUrls());
  await site.build();

  testPage(site, "/index", (page) => {
    equals(getHref(page, 0), "");
    equals(getHref(page, 1), "about-us");
    equals(getHref(page, 2), "./about-us/contact");
    equals(getHref(page, 3), "about-us/presentation");
    equals(getHref(page, 4), "?ignored=true");
    equals(getHref(page, 5), "#ignored");
    equals(getHref(page, 6), "https://ignored.com/");
    equals(getHref(page, 7), "//ignored.com");
  });

  testPage(site, "/about-us/index", (page) => {
    equals(getHref(page, 0), "..");
    equals(getHref(page, 1), "");
    equals(getHref(page, 2), "contact");
    equals(getHref(page, 3), "presentation");
  });

  testPage(site, "/about-us/contact", (page) => {
    equals(getHref(page, 0), "../..");
    equals(getHref(page, 1), "..");
    equals(getHref(page, 2), "");
    equals(getHref(page, 3), "../presentation");
  });

  testPage(site, "/about-us/presentation", (page) => {
    equals(getHref(page, 0), "../..");
    equals(getHref(page, 1), "..");
    equals(getHref(page, 2), "../contact");
    equals(getHref(page, 3), "");
  });
});

function getHref(page: Page, pos: number) {
  const a = page.document?.querySelectorAll("a")[pos] as Element | null;

  if (!a) {
    return;
  }

  return a.getAttribute("href");
}
