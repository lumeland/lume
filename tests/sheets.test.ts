import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import sheets from "../plugins/sheets.ts";
import { assertMatch } from "../deps/assert.ts";

Deno.test("Sheets plugin", async (t) => {
  const site = getSite({
    src: "sheets",
  });

  site.use(sheets());

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("Sheets date handling", async () => {
  const site = getSite({
    src: "sheets_date",
  });

  site.use(sheets({
    options: {
      cellDates: true,
    },
  }));

  await build(site);

  const output = site.pages[0].text;
  assertMatch(output, /^0 2025-01-01/m);
  assertMatch(output, /^1 2025-06-01/m);
});
