import { assertStrictEquals as equals } from "../deps/assert.ts";
import { getSite } from "./utils.ts";

Deno.test("render order property", async () => {
  const site = getSite({
    test: true,
    src: "render_order",
  });

  await site.build();

  const pages = site.pages;

  equals(pages.length, 10 + 10 + 2);
});
