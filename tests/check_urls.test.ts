import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import checkUrls from "../plugins/check_urls.ts";

Deno.test("check_urls plugin", async (t) => {
  const site = getSite({
    src: "check_urls",
  });

  site.use(checkUrls({
    output: "check_urls.json",
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("check_urls plugin (strict mode)", async (t) => {
  const site = getSite({
    src: "check_urls",
  });

  site.use(checkUrls({
    output: "check_urls.json",
    strict: true,
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
