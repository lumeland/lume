import { assertEquals } from "../deps/asserts.js";
import url from "../filters/url.js";

Deno.test("url filter (without options)", () => {
  const urlFilter = url({ options: {} });

  assertEquals("http://example.com/", urlFilter("http://example.com"));
  assertEquals("/bar", urlFilter("/bar"));
  assertEquals("/foo", urlFilter("foo"));
  assertEquals("./foo", urlFilter("./foo"));
  assertEquals("../foo", urlFilter("../foo"));
  assertEquals("/foo", urlFilter("foo", true));
});

Deno.test("url filter (with options)", () => {
  const urlFilter = url(
    { options: { location: new URL("https://example.com/bar") } },
  );

  assertEquals("http://example2.com/", urlFilter("http://example2.com"));
  assertEquals("/bar/bar", urlFilter("/bar"));
  assertEquals("/bar/foo", urlFilter("foo"));
  assertEquals("./foo", urlFilter("./foo"));
  assertEquals("../foo", urlFilter("../foo"));
  assertEquals("https://example.com/bar/foo", urlFilter("foo", true));
});
