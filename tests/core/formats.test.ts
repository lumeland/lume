import { assert, assertStrictEquals as equals } from "../../deps/assert.ts";
import Formats from "../../core/formats.ts";

Deno.test("Formats", async (t) => {
  const formats = new Formats();

  equals(formats.entries.size, 0);
  equals(formats.size, 0);

  await t.step("Add extensions", () => {
    formats.set({ ext: ".foo", asset: true });
    equals(formats.entries.size, 1);
    equals(formats.size, 1);
    equals(formats.get(".foo")?.ext, ".foo");
    equals(formats.get(".foo")?.asset, true);
    assert(formats.has(".foo"));

    formats.set({ ext: ".foo", asset: false });
    equals(formats.entries.size, 1);
    equals(formats.size, 1);
    equals(formats.get(".foo")?.ext, ".foo");
    equals(formats.get(".foo")?.asset, false);
    assert(formats.has(".foo"));
  });

  await t.step("Add subextensions", () => {
    formats.set({ ext: ".sub.foo", asset: true });
    equals(formats.entries.size, 2);
    equals(formats.size, 2);
    equals(formats.get(".foo")?.asset, false);
    equals(formats.get(".sub.foo")?.asset, true);
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
