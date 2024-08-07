import { assertStrictEquals as equals } from "../deps/assert.ts";
import { attr, className } from "../plugins/attributes.ts";

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

Deno.test("attr filter", () => {
  equals("one two", attr(["one", "two"]));
  equals('one="two"', attr({ one: "two" }));
  equals("one", attr({ one: true }));
  equals("two", attr({ one: null, two: true }));
  equals(
    "one two",
    attr([{ one: null, two: true }, { one: true }]),
  );
  equals('foo="&#34;bar&#34;"', attr({ foo: '"bar"' }));
  equals('class="foo bar"', attr({ class: "foo bar" }));
  equals('class="foo bar"', attr({ class: ["foo bar"] }));
  equals('class="foo"', attr({ class: ["foo", { bar: false }] }));
  equals(
    'class="foo bar"',
    attr({ class: ["foo", { bar: true }] }),
  );
  equals(
    'required class="foo bar"',
    attr(["required", { class: ["foo", { bar: true }] }]),
  );
  equals(
    'required class="foo bar"',
    attr(["required", { class: ["foo", { bar: true }] }]),
  );
  equals(
    'required class="foo bar"',
    attr([{ required: true }, { class: ["foo", { bar: true }] }]),
  );
  equals(
    'required class="foo bar"',
    attr([{ required: true, class: ["foo", { bar: true }] }]),
  );
  equals(
    'required class="foo bar"',
    attr(
      ["required", { class: "foo" }, { class: ["bar", { other: false }] }],
    ),
  );
  equals(
    'required class="foo" title="bar"',
    attr(
      ["required", { class: "foo" }, { id: "one", title: "bar" }],
      "required",
      "class",
      "title",
    ),
  );
  equals(
    'id="one"',
    attr(
      ["required", { class: "foo" }, { id: "one", title: "bar" }],
      "id",
    ),
  );
});
