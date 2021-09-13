import { assertStrictEquals as equals } from "../deps/assert.ts";
import { attributes, className } from "../plugins/attributes.ts";

Deno.test("classname filter", () => {
  equals("one two", className("one", "two"));
  equals("one", className("one", null));
  equals("one", className("one", undefined));
  equals("one two", className(["one", "two"]));
  equals("one two", className(["one", "two"], "two"));
  equals(
    "one two",
    className(["one", "", false, null, undefined, 0, "two"], "two"),
  );
  equals("one two", className({ one: true, two: 1 }));
  equals("one", className({ one: true, two: false }));
  equals("one two", className({ one: true, two: false }, "two"));
  equals(
    "one two",
    className({ one: true, two: false }, { one: false, two: true }),
  );
  equals("one two", className([{ one: true, two: true }]));
});

Deno.test("attributes filter", () => {
  equals("one two", attributes(["one", "two"]));
  equals('one="two"', attributes({ one: "two" }));
  equals("one", attributes({ one: true }));
  equals("two", attributes({ one: null, two: true }));
  equals(
    "one two",
    attributes([{ one: null, two: true }, { one: true }]),
  );
  equals('foo="&#34;bar&#34;"', attributes({ foo: '"bar"' }));
  equals('class="foo bar"', attributes({ class: "foo bar" }));
  equals('class="foo bar"', attributes({ class: ["foo bar"] }));
  equals('class="foo"', attributes({ class: ["foo", { bar: false }] }));
  equals(
    'class="foo bar"',
    attributes({ class: ["foo", { bar: true }] }),
  );
  equals(
    'required class="foo bar"',
    attributes(["required", { class: ["foo", { bar: true }] }]),
  );
  equals(
    'required class="foo bar"',
    attributes(["required", { class: ["foo", { bar: true }] }]),
  );
  equals(
    'required class="foo bar"',
    attributes([{ required: true }, { class: ["foo", { bar: true }] }]),
  );
  equals(
    'required class="foo bar"',
    attributes([{ required: true, class: ["foo", { bar: true }] }]),
  );
  equals(
    'required class="foo bar"',
    attributes(
      ["required", { class: "foo" }, { class: ["bar", { other: false }] }],
    ),
  );
  equals(
    'required class="foo" title="bar"',
    attributes(
      ["required", { class: "foo" }, { id: "one", title: "bar" }],
      "required",
      "class",
      "title",
    ),
  );
  equals(
    'id="one"',
    attributes(
      ["required", { class: "foo" }, { id: "one", title: "bar" }],
      "id",
    ),
  );
});
