import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import nunjucks from "../src/mod.ts";

describe("nunjucks plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
      location: new URL("https://example.com/blog"),
    });

    site.use(nunjucks());

    // Register an async filter
    site.filter(
      "returnAsync",
      (text) => new Promise((resolve) => setTimeout(() => resolve(`${text} (async)`), 10)),
      true,
    );

    // Register custom helpers
    site.helper("upperCase", (text) => `<strong>${(text as string).toUpperCase()}</strong>`, {
      type: "tag",
    });
    site.helper("upperCaseBody", (text) => `<strong>${(text as string).toUpperCase()}</strong>`, {
      type: "tag",
      body: true,
    });
    site.helper(
      "upperCaseAsync",
      (text) => Promise.resolve(`<strong>${(text as string).toUpperCase()}</strong>`),
      { type: "tag", async: true },
    );
    site.helper(
      "upperCaseBodyAsync",
      (text) => Promise.resolve(`<strong>${(text as string).toUpperCase()}</strong>`),
      { type: "tag", body: true, async: true },
    );

    site.filter("fromPage", function (key) {
      return this?.data?.[key];
    });
    site.filter(
      "fromPageAsync",
      function (key) {
        return Promise.resolve(this?.data?.[key]);
      },
      true,
    );
    site.helper(
      "fromPageTagAsync",
      function (key) {
        return Promise.resolve(`<strong>${this?.data?.[key]}</strong>`);
      },
      { type: "tag", body: true, async: true },
    );

    expect(await build(site)).toMatchSnapshot();
  });
});
