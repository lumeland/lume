import { assert, assertStrictEquals as equals } from "../deps/assert.ts";
import lume from "../mod.ts";
import date from "../plugins/date.ts";
import { modulePath } from "../deps/date.ts";
import { build, getDepVersion, getSite } from "./utils.ts";
import gl from "https://deno.land/x/date_fns@v2.22.1/locale/gl/index.js";
import pt from "https://deno.land/x/date_fns@v2.22.1/locale/pt/index.js";

const date0 = new Date(0);

Deno.test("date_fn version", async () => {
  const version = await getDepVersion("date.ts", "date_fns");
  equals(`https://deno.land/x/date_fns@${version}`, modulePath);
});

Deno.test("date plugin", async () => {
  const site = lume();
  site.use(date({
    formats: {
      "CUSTOM": "yyyy_dd",
    },
  }));

  const { helpers } = site.renderer;

  assert(!helpers.has("date"));
  await site.dispatchEvent({ type: "beforeBuild" });
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

Deno.test("date plugin with custom name", async () => {
  const site = lume();
  site.use(date({
    name: "dateify",
    locales: { gl, pt },
  }));

  await site.dispatchEvent({ type: "beforeBuild" });

  const { helpers } = site.renderer;
  const [format] = helpers.get("dateify")!;

  equals(format(date0, "HUMAN_DATE"), "1 de xaneiro 1970");
});

Deno.test("date plugin load locales automatically", async () => {
  const site = getSite({
    src: "simple",
  });

  site.use(date({
    locales: ["gl", "pt"],
  }));

  await build(site);

  const { helpers } = site.renderer;

  const [format] = helpers.get("date")!;
  equals(format(date0, "HUMAN_DATE"), "1 de xaneiro 1970");
  equals(format(date0, "HUMAN_DATE", "pt"), "1 de janeiro de 1970");
});
