import { assert, assertStrictEquals as equals } from "../deps/assert.ts";
import { assertEqualsPaths, build, getSite, testUrlPage } from "./utils.ts";
import imagick from "../plugins/imagick.ts";

Deno.test("imagick plugin", async () => {
  const site = getSite({
    src: "imagick",
  });

  site.use(imagick());

  const { formats } = site;

  // Register the .images loader
  assert(formats.has(".png"));
  equals(formats.get(".png")?.pageType, "asset");
  assert(formats.has(".jpg"));
  equals(formats.get(".jpg")?.pageType, "asset");
  assert(formats.has(".jpeg"));
  equals(formats.get(".jpeg")?.pageType, "asset");

  await build(site);

  equals(site.pages.length, 5);

  testUrlPage(site, "/lume.png", (page) => {
    assertEqualsPaths(page.src.path, "/lume");
    assert(page.content instanceof Uint8Array);
  });
  testUrlPage(site, "/lume-small.png", (page) => {
    assertEqualsPaths(page.src.path, "/lume[0]");
    assert(page.content instanceof Uint8Array);
  });
  testUrlPage(site, "/lume-big.png", (page) => {
    assertEqualsPaths(page.src.path, "/lume[1]");
    assert(page.content instanceof Uint8Array);
  });
  testUrlPage(site, "/lume.jpg", (page) => {
    assertEqualsPaths(page.src.path, "/lume[2]");
    assert(page.content instanceof Uint8Array);
  });
  testUrlPage(site, "/lume.webp", (page) => {
    assertEqualsPaths(page.src.path, "/lume[3]");
    assert(page.content instanceof Uint8Array);
  });
});
