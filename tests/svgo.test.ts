import { assert, assertStrictEquals as equals } from "../deps/assert.ts";
import { build, getSite, testPage } from "./utils.ts";
import svgo from "../plugins/svgo.ts";

Deno.test("terser plugin", async () => {
  const site = getSite({
    src: "svgo",
  });

  site.use(svgo());

  await build(site);

  equals(site.pages.length, 1);

  // Register the .svg loader
  const { formats } = site;

  assert(formats.has(".svg"));
  equals(formats.get(".svg")?.pageType, "asset");

  testPage(site, "/favicon", (page) => {
    equals(page.data.url, "/favicon.svg");
    equals(
      page.content,
      '<svg width="126" height="126" xmlns="http://www.w3.org/2000/svg"><path d="M52.868 7.995C48.907 24.097 69.167 21.154 69.167 44.72c6.628-7.615 1.28-17.875 11.891-27.547 0 22.213 21.097 20.964 12.954 52.052 3.775-2.313 6.49-6.121 8.143-11.425 3.336 5.304 2.09 14.73-3.738 28.279 5.13-2.164 8.141-5.156 9.961-9.352.663 29.238-18.872 49.64-46.391 49.268-27.52-.372-48.409-24.353-43.722-54.192.697 3.104 3.253 6.75 6.918 8.27-6.494-29.34 5.74-30.44 10.823-46.1-.826 8.324 0 12.952 4.015 17.786.71-2.112 1.994-4.12 3.351-6.131l.39-.575.196-.287.585-.865c2.784-4.138 5.281-8.413 3.205-13.732-3.379-8.658-3.057-12.024 5.12-22.174Zm-9.451 7.608c-2.174 2.218-1.702 8.672.797 14.34 2.498 5.667-.797 9.933-4.329 15.184.617-6.988-.026-8.647-3.026-14.02-3-5.372 1.11-12.484 6.558-15.504Zm21.355-7.57c5.083 4.416 6.886 4.857 7.437 9.404.552 4.548-1.912 6.66-.927 12.598-10.382-8.527-2.235-11.564-6.51-22.003ZM53.36 0c3.652 4.33 5.822 3.197 8.205 8.73 2.382 5.535-.602 6.79 1.436 13.445C51.003 11.853 58.446 11.017 53.359 0Z" fill="#C84F46" fill-rule="evenodd"/></svg>',
    );
  });
});
