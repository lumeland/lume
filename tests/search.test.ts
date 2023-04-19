import { assertSnapshot } from "../deps/snapshot.ts";
import { buildFilter, buildSort } from "../plugins/search.ts";

Deno.test("Search by Tags", async (t) => {
  const filter = buildFilter("foo bar");

  await assertSnapshot(t, filter.toString());
});

Deno.test("Search by NOT Tags", async (t) => {
  const filter = buildFilter("foo !bar");

  await assertSnapshot(t, filter.toString());
});

Deno.test("Search by Equal", async (t) => {
  const filter = buildFilter("foo=bar");

  await assertSnapshot(t, filter.toString());
});

Deno.test("Search by Equal undefined", async (t) => {
  const filter = buildFilter("foo=undefined");

  await assertSnapshot(t, filter.toString());
});

Deno.test("Search by Equal null", async (t) => {
  const filter = buildFilter("foo=null");

  await assertSnapshot(t, filter.toString());
});

Deno.test("Search by Upper than", async (t) => {
  const filter = buildFilter("foo>bar");

  await assertSnapshot(t, filter.toString());
});

Deno.test("Search by Upper or equals than", async (t) => {
  const filter = buildFilter("foo>=bar");

  await assertSnapshot(t, filter.toString());
});

Deno.test("Search by Lower than", async (t) => {
  const filter = buildFilter("foo<bar");

  await assertSnapshot(t, filter.toString());
});

Deno.test("Search by Lower or equals than", async (t) => {
  const filter = buildFilter("foo<=bar");

  await assertSnapshot(t, filter.toString());
});

Deno.test("Search by Not Equal", async (t) => {
  const filter = buildFilter("foo!=bar");

  await assertSnapshot(t, filter.toString());
});

Deno.test("Search by Not Equal alt", async (t) => {
  const filter = buildFilter("!foo=bar");

  await assertSnapshot(t, filter.toString());
});

Deno.test("Search by Starts With", async (t) => {
  const filter = buildFilter("foo^=bar");

  await assertSnapshot(t, filter.toString());
});

Deno.test("Search by NOT Starts With", async (t) => {
  const filter = buildFilter("!foo^=bar");

  await assertSnapshot(t, filter.toString());
});

Deno.test("Search by Ends With", async (t) => {
  const filter = buildFilter("foo$=bar");

  await assertSnapshot(t, filter.toString());
});

Deno.test("Search by Contains", async (t) => {
  const filter = buildFilter("foo*=bar");

  await assertSnapshot(t, filter.toString());
});

Deno.test("Search by Tags with OR", async (t) => {
  const filter = buildFilter("foo|bar");

  await assertSnapshot(t, filter.toString());
});

Deno.test("Search by Equal with OR", async (t) => {
  const filter = buildFilter("foo=bar|baz");

  await assertSnapshot(t, filter.toString());
});

Deno.test("Search by Not Equal with OR", async (t) => {
  const filter = buildFilter("foo!=bar|baz");

  await assertSnapshot(t, filter.toString());
});

Deno.test("Search by Starts With with OR", async (t) => {
  const filter = buildFilter("foo^=bar|baz");

  await assertSnapshot(t, filter.toString());
});

Deno.test("Search by Ends With with OR", async (t) => {
  const filter = buildFilter("foo$=bar|baz");

  await assertSnapshot(t, filter.toString());
});

Deno.test("Search by Contains with OR", async (t) => {
  const filter = buildFilter("foo*=bar|baz");

  await assertSnapshot(t, filter.toString());
});

Deno.test("Search Date by Equal", async (t) => {
  const filter = buildFilter("foo=2000-01-02");

  await assertSnapshot(t, filter.toString());
});

Deno.test("Search Date by Not Equal", async (t) => {
  const filter = buildFilter("foo!=2000-01-02");

  await assertSnapshot(t, filter.toString());
});

Deno.test("Search Date by lower than", async (t) => {
  const filter = buildFilter("foo<2000-01-02T18:00");

  await assertSnapshot(t, filter.toString());
});

Deno.test("Search Date by lower or equals than", async (t) => {
  const filter = buildFilter("foo<=2000-01-02T18:00");

  await assertSnapshot(t, filter.toString());
});

Deno.test("Search Date by upper than", async (t) => {
  const filter = buildFilter("foo>2000-01-02T18:00");

  await assertSnapshot(t, filter.toString());
});

Deno.test("Search Date by upper or equals than", async (t) => {
  const filter = buildFilter("foo>=2000-01-02T18:00");

  await assertSnapshot(t, filter.toString());
});

Deno.test("Sort by one field", async (t) => {
  const sort = buildSort("order");

  await assertSnapshot(t, sort);
});

Deno.test("Sort by one field DESC", async (t) => {
  const sort = buildSort("order=desc");

  await assertSnapshot(t, sort);
});

Deno.test("Sort by two fields", async (t) => {
  const sort = buildSort("order title");

  await assertSnapshot(t, sort);
});

Deno.test("Sort by two fields, sencod is DESC", async (t) => {
  const sort = buildSort("order title=desc");

  await assertSnapshot(t, sort);
});
