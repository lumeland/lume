import { describe, it, expect } from "vitest";
import Site from "../src/site.ts";

import type { Engine } from "../src/renderer.ts";

describe("Engines", async () => {
  const site = new Site();
  const { formats, renderer } = site;

  it("Add a template engine", async () => {
    site.loadPages([".foo"], {
      engine: new (class implements Engine {
        includes = "";
        render(content: string, data: Record<string, unknown>): string {
          return content + data.foo;
        }
        addHelper() {}
        deleteCache() {}
      })(),
    });

    expect(formats.size).toBe(1);
  });

  it("Run the template engine", async () => {
    const result = await renderer.render("content", { foo: "bar" }, "foo.foo");
    expect(result).toBe("contentbar");

    const result2 = await renderer.render("content", { foo: "bar" }, "foo.not_found");
    expect(result2).toBe("content");
  });

  it("Add other template engine", () => {
    site.loadPages([".upper"], {
      engine: new (class implements Engine {
        includes = "";
        render(content: string): string {
          return content.toUpperCase();
        }
        addHelper() {}
        deleteCache() {}
      })(),
    });

    expect(formats.size).toBe(2);
  });

  it("Run the other template engine", async () => {
    const result = await renderer.render("content", { foo: "bar" }, "foo.upper");
    expect(result).toBe("CONTENT");

    const result2 = await renderer.render("content", { foo: "bar" }, "foo.not_found");
    expect(result2).toBe("content");
  });

  it("templateEngine variable", async () => {
    const result = await renderer.render(
      "content",
      {
        foo: "bar",
        templateEngine: "foo",
      },
      "foo.upper",
    );
    expect(result).toBe("contentbar");

    const result2 = await renderer.render(
      "content",
      {
        foo: "bar",
        templateEngine: ["foo", "upper"],
      },
      "foo.not_found",
    );
    expect(result2).toBe("CONTENTBAR");

    const result3 = await renderer.render(
      "content",
      {
        foo: "bar",
        templateEngine: "upper,foo",
      },
      "foo.not_found",
    );
    expect(result3).toBe("CONTENTbar");
  });

  it("Add a helper", () => {
    renderer.addHelper("quoted", (val: string) => `"${val}"`, {
      type: "filter",
    });
    expect(renderer.helpers.has("quoted")).toBe(true);
  });
});
