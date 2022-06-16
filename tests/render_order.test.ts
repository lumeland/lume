import { assertStrictEquals as equals } from "../deps/assert.ts";
import { build, getSite } from "./utils.ts";

Deno.test("render order property", async () => {
  const site = getSite({
    src: "render_order",
  });

  site.addEventListener("afterRender", () => false);

  await build(site);

  const pages = site.pages;

  console.log(pages.map((page) => page.data.url));
  equals(pages.length, 10 + 10 + 2);
});
