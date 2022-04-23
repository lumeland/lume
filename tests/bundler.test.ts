import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import bundler from "../plugins/bundler.ts";

Deno.test("bundler plugin", async (t) => {
  const site = getSite({
    src: "bundler",
  });

  site.ignore("modules");
  site.use(bundler({
    extensions: [".ts", ".tsx"],
    options: {
      bundle: "module",
    },
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("bundler plugin (not bundle)", async (t) => {
  const site = getSite({
    src: "bundler",
  });

  site.use(bundler({
    extensions: [".ts", ".tsx"],
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
