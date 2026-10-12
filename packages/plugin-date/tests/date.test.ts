import { describe, it, expect } from "vitest";
import lume from "@lumeland/lume";
import { build, getSite } from "@lumeland/testing/site.ts";
import date from "../src/mod.ts";
import { gl } from "date-fns/locale/gl";
import { pt } from "date-fns/locale/pt";
import { enUS } from "date-fns/locale/en-US";
import { es } from "date-fns/locale/es";
import process from "node:process";

describe("date plugin", async () => {
  process.env["TZ"] = "Z";
  const date0 = new Date(0);

  it("should have a date helper", () => {
    const site = lume();
    site.use(
      date({
        formats: {
          CUSTOM: "yyyy_dd",
        },
      }),
    );

    const { helpers } = site.renderer;

    expect(helpers.has("date")).toBeTruthy();

    const [format] = helpers.get("date")!;

    expect(format(date0, "yyyy-MM-dd")).toBe("1970-01-01");
    expect(format("now", "yyyy")).toBe(new Date().getFullYear().toString());
    expect(format(date0)).toBe("1970-01-01");
    expect(format(date0, "ATOM")).toBe("1970-01-01T00:00:00Z");
    expect(format(date0, "DATE")).toBe("1970-01-01");
    expect(format(date0, "DATETIME")).toBe("1970-01-01 00:00:00");
    expect(format(date0, "TIME")).toBe("00:00:00");
    expect(format(date0, "HUMAN_DATE")).toBe("January 1st, 1970");
    expect(format(date0, "HUMAN_DATETIME")).toBe("January 1st, 1970 at 12:00:00 AM GMT+0");
    expect(format(date0, "CUSTOM")).toBe("1970_01");
  });

  it("should format human dates", async () => {
    const site = lume();
    site.use(date());

    const { helpers } = site.renderer;
    expect(helpers.has("date")).toBeTruthy();
    const [format] = helpers.get("date")!;

    const aBitMoreThanAYearFromNow = new Date(Date.now() + 367 * 24 * 60 * 60 * 1000);
    // See https://date-fns.org/v3.6.0/docs/formatDistanceToNow
    expect(format(aBitMoreThanAYearFromNow, "HUMAN_SINCE")).toBe("about 1 year");
    // See https://date-fns.org/v3.6.0/docs/formatDistanceToNowStrict
    expect(format(aBitMoreThanAYearFromNow, "HUMAN_SINCE_STRICT")).toBe("1 year");
  });

  it("should manage custom locales", async () => {
    const site = lume();
    site.use(
      date({
        locales: { gl, pt },
      }),
    );

    await site.dispatchEvent({ type: "beforeBuild" });

    const { helpers } = site.renderer;
    const [format] = helpers.get("date")!;

    expect(format(date0, "HUMAN_DATE")).toBe("1 de xaneiro 1970");
    expect(format(date0, "HUMAN_DATE", "pt")).toBe("1 de janeiro de 1970");
    expect(format(date0, "HUMAN_DATETIME")).toBe("1 de xaneiro 1970 ás 00:00:00 GMT+0");
    expect(format(date0, "HUMAN_DATETIME", "pt")).toBe("1 de janeiro de 1970 às 00:00:00 GMT+0");
  });

  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(
      date({
        locales: { es, gl, en: enUS },
      }),
    );

    expect(await build(site)).toMatchSnapshot();
  });
});
