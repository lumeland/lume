import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import liquid from "../plugins/liquid.ts";

Deno.test("build a site with liquid", async (t) => {
  const site = getSite({
    src: "liquid",
    location: new URL("https://example.com/blog"),
  });

  site.use(liquid());

  // Register an async filter
  site.filter(
    "returnAsync",
    (text) =>
      new Promise((resolve) =>
        setTimeout(() => resolve(`${text} (async)`), 10)
      ),
    true,
  );

  // Register custom tags
  site.helper(
    "upperCase",
    (text) => `<strong>${(text as string).toUpperCase()}</strong>`,
    { type: "tag" },
  );
  site.helper(
    "upperCaseBody",
    (text) => `<strong>${(text as string).toUpperCase()}</strong>`,
    { type: "tag", body: true },
  );
  site.helper(
    "upperCaseAsync",
    (text) =>
      Promise.resolve(`<strong>${(text as string).toUpperCase()}</strong>`),
    { type: "tag", async: true },
  );
  site.helper(
    "upperCaseBodyAsync",
    (text) =>
      Promise.resolve(`<strong>${(text as string).toUpperCase()}</strong>`),
    { type: "tag", body: true, async: true },
  );

  site.filter("fromPage", function (key) {
    return this.data[key];
  });
  site.filter("fromPageAsync", function (key) {
    return Promise.resolve(this.data[key]);
  }, true);
  site.helper(
    "fromPageTagAsync",
    function (key) {
      return Promise.resolve(`<strong>${this.data[key]}</strong>`);
    },
    { type: "tag", body: true, async: true },
  );

  await build(site);
  await assertSiteSnapshot(t, site);
});
