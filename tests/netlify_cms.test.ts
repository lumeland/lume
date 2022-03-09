import { parse } from "../deps/yaml.ts";
import { assertStrictEquals as equals } from "../deps/assert.ts";
import { build, getSite, testUrlPage } from "./utils.ts";
import netlifyCMS from "../plugins/netlify_cms.ts";

Deno.test("code_hightlight plugin", async () => {
  const site = getSite({
    src: "netlify_cms",
    location: new URL("https://example.com"),
  });

  site.use(netlifyCMS({
    local: false,
  }));

  await build(site);

  testUrlPage(site, "/admin/", (page) => {
    equals(page.data.url, "/admin/");
    const document = page.document!;
    equals(
      document.querySelector(`link[rel="cms-config-url"]`)?.getAttribute(
        "href",
      ),
      "/admin/config.yml",
    );
  });

  testUrlPage(site, "/admin/config.yml", (page) => {
    equals(page.data.url, "/admin/config.yml");
    const config = parse(page.content as string) as Record<string, unknown>;
    equals(config.local_backend, false);
    equals(config.site_url, "https://example.com/");
  });
});
