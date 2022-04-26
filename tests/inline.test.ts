import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import inline from "../plugins/inline.ts";
import binaryLoader from "../core/loaders/binary.ts";
import { DOMParser } from "../deps/dom.ts";
import { assertEquals } from "../deps/assert.ts";

Deno.test("code_hightlight plugin", async (t) => {
  const site = getSite({
    src: "inline",
  });

  site.use(inline());
  site.loadAssets([".svg", ".js"]);
  site.loadAssets([".png"], binaryLoader);
  site.copy("favicon.png", "favicon2.png");

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("inline plugin with innerHTML", () => {
  const doc = new DOMParser().parseFromString(
    `<script></script>`,
    "text/html",
  )!;
  const e = doc.querySelector("script")!;
  const script = 'const a=1,b=1<a,b=a>4;';
  e.innerHTML = script
  assertEquals(script, e.innerHTML)
});

Deno.test("inline plugin with textContent", () => {
  const doc = new DOMParser().parseFromString(
    `<script></script>`,
    "text/html",
  )!;
  const e = doc.querySelector("script")!;
  const script = 'const a=1,b=1<a,b=a>4;';
  e.textContent = script
  assertEquals(script, e.innerHTML)
});
