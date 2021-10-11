import { assertStrictEquals as equals } from "../deps/assert.ts";
import { buildFilter, buildSort } from "../plugins/search.ts";

Deno.test("Search by Tags", () => {
  const filter = buildFilter("foo bar");

  equals(
    "(page) => page.dest?.ext === value0 && page.data?.tags?.includes(value1) && page.data?.tags?.includes(value2)",
    filter.toString(),
  );
});

Deno.test("Search by Equal", () => {
  const filter = buildFilter("foo=bar");

  equals(
    "(page) => page.dest?.ext === value0 && page.data?.foo === value1",
    filter.toString(),
  );
});

Deno.test("Search by Upper than", () => {
  const filter = buildFilter("foo>bar");

  equals(
    "(page) => page.dest?.ext === value0 && page.data?.foo > value1",
    filter.toString(),
  );
});

Deno.test("Search by Upper or equals than", () => {
  const filter = buildFilter("foo>=bar");

  equals(
    "(page) => page.dest?.ext === value0 && page.data?.foo >= value1",
    filter.toString(),
  );
});

Deno.test("Search by Lower than", () => {
  const filter = buildFilter("foo<bar");

  equals(
    "(page) => page.dest?.ext === value0 && page.data?.foo < value1",
    filter.toString(),
  );
});

Deno.test("Search by Lower or equals than", () => {
  const filter = buildFilter("foo<=bar");

  equals(
    "(page) => page.dest?.ext === value0 && page.data?.foo <= value1",
    filter.toString(),
  );
});

Deno.test("Search by Not Equal", () => {
  const filter = buildFilter("foo!=bar");

  equals(
    "(page) => page.dest?.ext === value0 && page.data?.foo !== value1",
    filter.toString(),
  );
});

Deno.test("Search by Starts With", () => {
  const filter = buildFilter("foo^=bar");

  equals(
    "(page) => page.dest?.ext === value0 && page.data?.foo?.startsWith(value1)",
    filter.toString(),
  );
});

Deno.test("Search by Ends With", () => {
  const filter = buildFilter("foo$=bar");

  equals(
    "(page) => page.dest?.ext === value0 && page.data?.foo?.endsWith(value1)",
    filter.toString(),
  );
});

Deno.test("Search by Contains", () => {
  const filter = buildFilter("foo*=bar");

  equals(
    "(page) => page.dest?.ext === value0 && page.data?.foo?.includes(value1)",
    filter.toString(),
  );
});

Deno.test("Search by Tags with OR", () => {
  const filter = buildFilter("foo|bar");

  equals(
    "(page) => page.dest?.ext === value0 && value1.some((i) => page.data?.tags?.includes(i))",
    filter.toString(),
  );
});

Deno.test("Search by Equal with OR", () => {
  const filter = buildFilter("foo=bar|baz");

  equals(
    "(page) => page.dest?.ext === value0 && value1.some((i) => page.data?.foo === i)",
    filter.toString(),
  );
});

Deno.test("Search by Not Equal with OR", () => {
  const filter = buildFilter("foo!=bar|baz");

  equals(
    "(page) => page.dest?.ext === value0 && value1.some((i) => page.data?.foo !== i)",
    filter.toString(),
  );
});

Deno.test("Search by Starts With with OR", () => {
  const filter = buildFilter("foo^=bar|baz");

  equals(
    "(page) => page.dest?.ext === value0 && value1.some((i) => page.data?.foo?.startsWith(i))",
    filter.toString(),
  );
});

Deno.test("Search by Ends With with OR", () => {
  const filter = buildFilter("foo$=bar|baz");

  equals(
    "(page) => page.dest?.ext === value0 && value1.some((i) => page.data?.foo?.endsWith(i))",
    filter.toString(),
  );
});

Deno.test("Search by Contains with OR", () => {
  const filter = buildFilter("foo*=bar|baz");

  equals(
    "(page) => page.dest?.ext === value0 && value1.some((i) => page.data?.foo?.includes(i))",
    filter.toString(),
  );
});

Deno.test("Search Date by Equal", () => {
  const filter = buildFilter("foo=2000-01-02");

  equals(
    "(page) => page.dest?.ext === value0 && page.data?.foo?.getTime() === value1.getTime()",
    filter.toString(),
  );
});

Deno.test("Search Date by Not Equal", () => {
  const filter = buildFilter("foo!=2000-01-02");

  equals(
    "(page) => page.dest?.ext === value0 && page.data?.foo?.getTime() !== value1.getTime()",
    filter.toString(),
  );
});

Deno.test("Search Date by lower than", () => {
  const filter = buildFilter("foo<2000-01-02T18:00");

  equals(
    "(page) => page.dest?.ext === value0 && page.data?.foo?.getTime() < value1.getTime()",
    filter.toString(),
  );
});

Deno.test("Search Date by lower or equals than", () => {
  const filter = buildFilter("foo<=2000-01-02T18:00");

  equals(
    "(page) => page.dest?.ext === value0 && page.data?.foo?.getTime() <= value1.getTime()",
    filter.toString(),
  );
});

Deno.test("Search Date by upper than", () => {
  const filter = buildFilter("foo>2000-01-02T18:00");

  equals(
    "(page) => page.dest?.ext === value0 && page.data?.foo?.getTime() > value1.getTime()",
    filter.toString(),
  );
});

Deno.test("Search Date by upper or equals than", () => {
  const filter = buildFilter("foo>=2000-01-02T18:00");

  equals(
    "(page) => page.dest?.ext === value0 && page.data?.foo?.getTime() >= value1.getTime()",
    filter.toString(),
  );
});

Deno.test("Sort by one field", () => {
  const sort = buildSort("order");

  equals(
    "function anonymous(a,b\n) {\nreturn (a.data?.order == b.data?.order ? 0 : (a.data?.order < b.data?.order ? -1 : 1))\n}",
    sort.toString(),
  );
});

Deno.test("Sort by one field DESC", () => {
  const sort = buildSort("order=desc");

  equals(
    "function anonymous(a,b\n) {\nreturn (a.data?.order == b.data?.order ? 0 : (a.data?.order > b.data?.order ? -1 : 1))\n}",
    sort.toString(),
  );
});

Deno.test("Sort by two fields", () => {
  const sort = buildSort("order title");

  equals(
    "function anonymous(a,b\n) {\nreturn (a.data?.order == b.data?.order ? (a.data?.title == b.data?.title ? 0 : (a.data?.title < b.data?.title ? -1 : 1)) : (a.data?.order < b.data?.order ? -1 : 1))\n}",
    sort.toString(),
  );
});

Deno.test("Sort by two fields, sencod is DESC", () => {
  const sort = buildSort("order title=desc");

  equals(
    "function anonymous(a,b\n) {\nreturn (a.data?.order == b.data?.order ? (a.data?.title == b.data?.title ? 0 : (a.data?.title > b.data?.title ? -1 : 1)) : (a.data?.order < b.data?.order ? -1 : 1))\n}",
    sort.toString(),
  );
});
