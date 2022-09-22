import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import { assertStrictEquals } from "../deps/assert.ts";
import pagefind from "../plugins/pagefind.ts";
import downloadBinary from "../deps/pagefind.ts";
import { fromFileUrl } from "../deps/path.ts";

Deno.test("Pagefind plugin", async (t) => {
  const site = getSite({
    src: "pagefind",
  });

  site.use(pagefind());

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("Pagefind download", async (t) => {
  const dest = fromFileUrl(import.meta.resolve("./_binary/pagefind"));
  const binary = await downloadBinary(dest, true);

  if (Deno.build.os === "windows") {
    assertStrictEquals(binary, dest + ".exe");
  } else {
    assertStrictEquals(binary, dest);
  }
  const process = Deno.run({
    cmd: [binary, "--version"],
  });
  const status = await process.status();
  assertStrictEquals(status.code, 0);
  process.close();
});
