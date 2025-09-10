import { assert, assertStrictEquals as equals } from "../deps/assert.ts";
import lume from "../mod.ts";
import date from "../plugins/date.ts";
import { gl } from "npm:date-fns@4.1.0/locale/gl";
import { pt } from "npm:date-fns@4.1.0/locale/pt";

const date0 = new Date(0);

Deno.test("date plugin", () => {
  const site = lume();
  site.use(date({
    formats: {
      "CUSTOM": "yyyy_dd",
    },
  }));

  const { helpers } = site.renderer;

  assert(helpers.has("date"));

  const [format] = helpers.get("date")!;

  equals(format(date0, "yyyy-MM-dd"), "1970-01-01");
  equals(format("now", "yyyy"), new Date().getFullYear().toString());
  equals(format(date0), "1970-01-01");
  equals(format(date0, "ATOM"), "1970-01-01T00:00:00Z");
  equals(format(date0, "DATE"), "1970-01-01");
  equals(format(date0, "DATETIME"), "1970-01-01 00:00:00");
  equals(format(date0, "TIME"), "00:00:00");
  equals(format(date0, "HUMAN_DATE"), "January 1st, 1970");
  equals(
    format(date0, "HUMAN_DATETIME"),
    "January 1st, 1970 at 12:00:00 AM GMT+0",
  );
  equals(format(date0, "CUSTOM"), "1970_01");
});

Deno.test("date plugin formats: HUMAN_SINCE and HUMAN_SINCE_STRICT", () => {
  const site = lume();
  site.use(date());

  const { helpers } = site.renderer;
  assert(helpers.has("date"));
  const [format] = helpers.get("date")!;

  const aBitMoreThanAYearFromNow = new Date(
    Date.now() + 367 * 24 * 60 * 60 * 1000,
  );
  // See https://date-fns.org/v3.6.0/docs/formatDistanceToNow
  equals(format(aBitMoreThanAYearFromNow, "HUMAN_SINCE"), "about 1 year");
  // See https://date-fns.org/v3.6.0/docs/formatDistanceToNowStrict
  equals(format(aBitMoreThanAYearFromNow, "HUMAN_SINCE_STRICT"), "1 year");
});

Deno.test("date plugin with custom locale", async () => {
  const site = lume();
  site.use(date({
    locales: { gl, pt },
  }));

  await site.dispatchEvent({ type: "beforeBuild" });

  const { helpers } = site.renderer;
  const [format] = helpers.get("date")!;

  equals(format(date0, "HUMAN_DATE"), "1 de xaneiro 1970");
  equals(format(date0, "HUMAN_DATE", "pt"), "1 de janeiro de 1970");
  equals(
    format(date0, "HUMAN_DATETIME"),
    "1 de xaneiro 1970 ás 00:00:00 GMT+0",
  );
  equals(
    format(date0, "HUMAN_DATETIME", "pt"),
    "1 de janeiro de 1970 às 00:00:00 GMT+0",
  );
});
