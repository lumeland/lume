import { assertStrictEquals as equals } from "../deps/assert.ts";
import { getSite, testPage } from "./utils.ts";
import { Page } from "../core.ts";
import basePath from "../plugins/base_path.ts";

Deno.test("base_path plugin", async () => {
  const site = getSite({
    src: "base_path",
    location: new URL("https://example.com/blog"),
  });

  site.use(basePath());
  await site.build();

  testPage(site, "/index", (page) => {
    equals(getAttribute(page, "style-1", "href"), "/blog/style.css");
    equals(getAttribute(page, "style-2", "href"), "other-styles.css");
    equals(getAttribute(page, "style-3", "href"), "./other-styles.css");
    equals(
      getAttribute(page, "preload-1", "href"),
      "/blog/fonts/cicle_fina-webfont.woff2",
    );
    equals(
      getAttribute(page, "preload-2", "imagesrcset"),
      "/blog/image-400.jpg 400w, /blog/image-800.jpg 800w, /blog/image-1600.jpg 1600w",
    );
    equals(getAttribute(page, "link-1", "href"), "/blog/");
    equals(getAttribute(page, "link-2", "href"), "/blog/");
    equals(getAttribute(page, "img-1", "src"), "/blog/img/avatar.png");
    equals(
      getAttribute(page, "img-2", "srcset"),
      "/blog/image-400.jpg 400w, /blog/image-800.jpg 800w, /blog/image-1600.jpg 1600w",
    );
    equals(
      getAttribute(page, "source-1", "srcset"),
      "/blog/image.jpeg x1, /blog/image-big.jpeg",
    );
  });
});

function getAttribute(page: Page, id: string, attr: string) {
  const el = page.document?.getElementById(id);
  return el ? el.getAttribute(attr) : null;
}
