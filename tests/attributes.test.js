import { assertEquals } from "../deps/asserts.js";
import filter from "../filters/attributes.js";

Deno.test("attributes filter", () => {
  const attributes = filter();

  assertEquals("one two", attributes(["one", "two"]));
  assertEquals('one="two"', attributes({ one: "two" }));
  assertEquals("one", attributes({ one: true }));
  assertEquals("two", attributes({ one: null, two: true }));
  assertEquals(
    "one two",
    attributes([{ one: null, two: true }, { one: true }]),
  );
  assertEquals('foo="&#34;bar&#34;"', attributes({ foo: '"bar"' }));
  assertEquals('class="foo bar"', attributes({ class: "foo bar" }));
  assertEquals('class="foo bar"', attributes({ class: ["foo bar"] }));
  assertEquals('class="foo"', attributes({ class: ["foo", { bar: false }] }));
  assertEquals(
    'class="foo bar"',
    attributes({ class: ["foo", { bar: true }] }),
  );
  assertEquals(
    'required class="foo bar"',
    attributes(["required", { class: ["foo", { bar: true }] }]),
  );
  assertEquals(
    'required class="foo bar"',
    attributes(["required", { class: ["foo", { bar: true }] }]),
  );
  assertEquals(
    'required class="foo bar"',
    attributes([{ required: true }, { class: ["foo", { bar: true }] }]),
  );
  assertEquals(
    'required class="foo bar"',
    attributes([{ required: true, class: ["foo", { bar: true }] }]),
  );
  assertEquals(
    'required class="foo bar"',
    attributes(
      ["required", { class: "foo" }, { class: ["bar", { other: false }] }],
    ),
  );
  assertEquals(
    'required class="foo" title="bar"',
    attributes(
      ["required", { class: "foo" }, { id: "one", title: "bar" }],
      "required",
      "class",
      "title",
    ),
  );
  assertEquals(
    'id="one"',
    attributes(
      ["required", { class: "foo" }, { id: "one", title: "bar" }],
      "id",
    ),
  );
});

Deno.test("attributes filter with predefined valid names", () => {
  const attributes = filter();

  assertEquals(
    'href="/" class="foo" title="bar"',
    attributes(
      [{ href: "/" }, "required", { class: "foo" }, { title: "bar" }],
      "A",
    ),
  );
});
