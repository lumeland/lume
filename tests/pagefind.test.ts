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

Deno.test("Pagefind download", async () => {
  const path = fromFileUrl(import.meta.resolve("./_binary/pagefind"));
  const binary = await downloadBinary({
    path,
    extended: true,
    version: "v0.10.3",
  });

  if (Deno.build.os === "windows") {
    assertStrictEquals(binary, path + ".exe");
  } else {
    assertStrictEquals(binary, path);
  }
  const { code, stdout } = Deno.spawnSync(binary, { args: ["--version"] });

  assertStrictEquals(code, 0);
  assertStrictEquals(
    new TextDecoder().decode(stdout).trim(),
    "pagefind 0.10.3",
  );
});
