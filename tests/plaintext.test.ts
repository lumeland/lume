import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import plaintext from "../plugins/plaintext.ts";

Deno.test("Plain text filter", async (t) => {
  const site = getSite({
    src: "plaintext",
  });

  site.use(plaintext());

  await build(site);
  await assertSiteSnapshot(t, site);
});
