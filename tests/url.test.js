import { assertEquals } from "../deps/asserts.js";
import url from "../filters/url.js";

Deno.test("attributes filter (without options)", () => {
  const urlFilter = url();

  assertEquals("http://example.com/", urlFilter("http://example.com"));
  assertEquals("/bar", urlFilter("/bar"));
  assertEquals("/foo", urlFilter("foo"));
  assertEquals("/foo", urlFilter("foo", true));
});

Deno.test("attributes filter (with options)", () => {
  const urlFilter = url({
    pathPrefix: "/bar",
    url: "https://example.com",
  });

  assertEquals("http://example.com/", urlFilter("http://example.com"));
  assertEquals("/bar/bar", urlFilter("/bar"));
  assertEquals("/bar/foo", urlFilter("foo"));
  assertEquals("https://example.com/bar/foo", urlFilter("foo", true));
});
