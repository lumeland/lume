import { assertStrictEquals as equals } from "../../deps/assert.ts";
import Extensions from "../../core/extensions.ts";

Deno.test("Extensions", async (t) => {
  const extensions = new Extensions<string>();

  equals(extensions.values().length, 0);

  await t.step("Add extensions", () => {
    extensions.set(".foo", "foo");
    equals(extensions.values().length, 1);
    equals(extensions.get(".foo"), "foo");
  });

  await t.step("Add subextensions", () => {
    extensions.set(".sub.foo", "sub-foo");
    equals(extensions.values().length, 2);
    equals(extensions.get(".foo"), "foo");
    equals(extensions.get(".sub.foo"), "sub-foo");
  });

  await t.step("Add default extension", () => {
    extensions.set("*", "default");
    equals(extensions.values().length, 2);
    equals(extensions.get(".foo"), "foo");
    equals(extensions.get(".sub.foo"), "sub-foo");
    equals(extensions.get(".other"), "default");
  });
});
