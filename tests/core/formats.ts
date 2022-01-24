import { assert, assertStrictEquals as equals } from "../../deps/assert.ts";
import Formats from "../../core/formats.ts";

Deno.test("Formats", async (t) => {
  const formats = new Formats();

  equals(formats.values().size, 0);
  equals(formats.keys().size, 0);
  equals(formats.entries.length, 0);
  equals(formats.size, 0);

  await t.step("Add extensions", () => {
    formats.set(".foo", { includesPath: "bar" });
    equals(formats.values().size, 1);
    equals(formats.size, 1);
    equals(formats.get(".foo")?.includesPath, "bar");
    assert(formats.has(".foo"));

    formats.set(".foo", { includesPath: "foo" });
    equals(formats.values().size, 1);
    equals(formats.size, 1);
    equals(formats.get(".foo")?.includesPath, "foo");
    assert(formats.has(".foo"));
  });

  await t.step("Add subextensions", () => {
    formats.set(".sub.foo", { includesPath: "sub-foo" });
    equals(formats.values().size, 2);
    equals(formats.size, 2);
    equals(formats.get(".foo")?.includesPath, "foo");
    equals(formats.get(".sub.foo")?.includesPath, "sub-foo");
    assert(formats.has(".sub.foo"));
  });

  await t.step("Search extensions", () => {
    const format = formats.search("name.foo");
    assert(format);
    equals(format[0], ".foo");
    equals(format[1].includesPath, { includesPath: "foo" });
  });

  await t.step("Search subextensions", () => {
    const format = formats.search("name.sub.foo");
    assert(format);
    equals(format[0], ".sub.foo");
    equals(format[1].includesPath, { includesPath: "sub-foo" });
  });
});
