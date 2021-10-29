import { assertStrictEquals as equals } from "../deps/assert.ts";
import lume from "../mod.ts";
import date from "../plugins/date.ts";
import gl from "https://deno.land/x/date_fns@v2.22.1/locale/gl/index.js";
import pt from "https://deno.land/x/date_fns@v2.22.1/locale/pt/index.js";

Deno.env.set("TZ", "Z");
const date0 = new Date(Date.UTC(1970, 0, 1));

Deno.test("date plugin", () => {
  const site = lume();
  site.use(date({
    formats: {
      "CUSTOM": "yyyy_dd",
    },
  }));

  const [format] = site.renderer.helpers.get("date")!;

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

Deno.test("date plugin with custom locale", () => {
  const site = lume();
  site.use(date({
    locales: { gl, pt },
  }));

  const [format] = site.renderer.helpers.get("date")!;

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
