import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import sheets from "../src/mod.ts";

describe("sheets plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(sheets());

    expect(await build(site)).toMatchSnapshot();
  });

  it("should match date handling", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets-date"),
    });

    site.use(
      sheets({
        options: {
          cellDates: true,
        },
      }),
    );

    await build(site);

    const output = site.pages[0].text;
    expect(output).toMatch(/^0 2025-01-01/m);
    expect(output).toMatch(/^1 2025-06-01/m);
  });
});
