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
    "upperCaseAsync",
    (text) =>
      Promise.resolve(`<strong>${(text as string).toUpperCase()}</strong>`),
    { type: "tag", async: true },
  );

  await build(site);
  await assertSiteSnapshot(t, site);
});
