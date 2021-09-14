import { assertStrictEquals as equals } from "../deps/assert.ts";
import lume from "../mod.ts";
import date from "../plugins/date.ts";
import gl from "https://deno.land/x/date_fns@v2.22.1/locale/gl/index.js";
import pt from "https://deno.land/x/date_fns@v2.22.1/locale/pt/index.js";

Deno.test("date plugin", () => {
  const site = lume();
  site.use(date({
    formats: {
      "CUSTOM": "yyyy_dd",
    },
  }));

  const [format] = site.helpers.get("date")!;

  equals(format(new Date(0), "yyyy-MM-dd"), "1970-01-01");
  equals(format("now", "yyyy"), new Date().getFullYear().toString());
  equals(format(new Date(0)), "1970-01-01");
  equals(format(new Date(0), "ATOM"), "1970-01-01T01:00:00+01:00");
  equals(format(new Date(0), "DATE"), "1970-01-01");
  equals(format(new Date(0), "DATETIME"), "1970-01-01 01:00:00");
  equals(format(new Date(0), "TIME"), "01:00:00");
  equals(format(new Date(0), "HUMAN_DATE"), "January 1st, 1970");
  equals(
    format(new Date(0), "HUMAN_DATETIME"),
    "January 1st, 1970 at 1:00:00 AM GMT+1",
  );
  equals(format(new Date(0), "CUSTOM"), "1970_01");
});

Deno.test("date plugin with custom locale", () => {
  const site = lume();
  site.use(date({
    locales: { gl, pt },
  }));

  const [format] = site.helpers.get("date")!;

  equals(format(new Date(0), "HUMAN_DATE"), "1 de xaneiro 1970");
  equals(format(new Date(0), "HUMAN_DATE", "pt"), "1 de janeiro de 1970");
  equals(
    format(new Date(0), "HUMAN_DATETIME"),
    "1 de xaneiro 1970 ás 01:00:00 GMT+1",
  );
  equals(
    format(new Date(0), "HUMAN_DATETIME", "pt"),
    "1 de janeiro de 1970 às 01:00:00 GMT+1",
  );
});
