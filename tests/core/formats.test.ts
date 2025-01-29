import { assert, assertStrictEquals as equals } from "../../deps/assert.ts";
import Formats from "../../core/formats.ts";

Deno.test("Formats", async (t) => {
  const formats = new Formats();

  equals(formats.entries.size, 0);
  equals(formats.size, 0);

  await t.step("Add extensions", () => {
    formats.set({ ext: ".foo" });
    equals(formats.entries.size, 1);
    equals(formats.size, 1);
    equals(formats.get(".foo")?.ext, ".foo");
    assert(formats.has(".foo"));

    formats.set({ ext: ".foo" });
    equals(formats.entries.size, 1);
    equals(formats.size, 1);
    equals(formats.get(".foo")?.ext, ".foo");
    assert(formats.has(".foo"));
  });

  await t.step("Add subextensions", () => {
    formats.set({ ext: ".sub.foo" });
    equals(formats.entries.size, 2);
    equals(formats.size, 2);
    assert(formats.has(".sub.foo"));
  });

  await t.step("Search extensions", () => {
    const format = formats.search("name.foo");
    assert(format);
    equals(format.ext, ".foo");
  });

  await t.step("Search subextensions", () => {
    const format = formats.search("name.sub.foo");
    assert(format);
    equals(format.ext, ".sub.foo");
  });
});
