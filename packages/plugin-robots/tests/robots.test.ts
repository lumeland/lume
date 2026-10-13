import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import robots from "../src/mod.ts";

describe("robots plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(robots());

    expect(await build(site)).toMatchSnapshot();
  });

  it("allow", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(
      robots({
        allow: ["Googlebot", "Bingbot"],
      }),
    );

    expect(await build(site)).toMatchSnapshot();
  });

  it("disallow", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(
      robots({
        disallow: "ChatGPT-User",
      }),
    );

    expect(await build(site)).toMatchSnapshot();
  });

  it("should block robots and AI", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(
      robots({
        allow: "AllowThis",
        disallow: "DisallowThat",
        disallowAI: true,
      }),
    );

    expect(await build(site)).toMatchSnapshot();
  });

  it("should block with custom rules", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(
      robots({
        rules: [
          {
            userAgent: "*",
            disallow: "/admin",
          },
          {
            userAgent: ["MistralAI-User", "ChatGPT-User"],
            disallow: ["/img", "/assets"],
          },
          {
            sitemap: new URL("/sitemap.xml", site.options.location).href,
          },
        ],
      }),
    );

    expect(await build(site)).toMatchSnapshot();
  });
});
