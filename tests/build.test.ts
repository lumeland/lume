import {
  assertEquals,
  assertStrictEquals as equals,
  assertStringIncludes as contains,
} from "../deps/assert.ts";
import { getSite } from "./utils.ts";
import { SiteEvent } from "../core.ts";

Deno.test("build a simple site", async () => {
  const site = getSite({
    src: "simple",
  });

  await site.build();

  const { pages } = site;

  // Test the generated pages
  equals(pages.length, 1);
  equals(pages[0].src.path, "/page1");
  equals(pages[0].src.ext, ".md");
  equals(pages[0].dest.path, "/page1/index");
  equals(pages[0].dest.ext, ".html");
  equals(pages[0].data.url, "/page1/");
  contains(pages[0].content as string, "<h1>Welcome</h1>");

  // Test the enumerated properties
  const page = site.pages[0];
  assertEquals(Object.keys(page), ["src", "parent", "data", "dest"]);
});

Deno.test("build/update events", async () => {
  const site = getSite(
    {
      src: "empty",
    },
    {},
    false,
  );

  const events: string[] = [];

  const listener = (event: SiteEvent) => events.push(event.type);
  const updateListener = (event: SiteEvent) => {
    equals(event.files!.size, 1);
    equals(event.files!.has("/page1.md"), true);
    listener(event);
  };

  site.addEventListener("beforeBuild", listener);
  site.addEventListener("afterBuild", listener);
  site.addEventListener("beforeUpdate", updateListener);
  site.addEventListener("afterUpdate", updateListener);
  site.addEventListener("beforeSave", listener);
  site.addEventListener("afterRender", listener);

  await site.build();

  equals(events.length, 4);
  equals(events[0], "beforeBuild");
  equals(events[1], "afterRender");
  equals(events[2], "beforeSave");
  equals(events[3], "afterBuild");

  await site.update(new Set(["/page1.md"]));

  equals(events.length, 8);
  equals(events[4], "beforeUpdate");
  equals(events[5], "afterRender");
  equals(events[6], "beforeSave");
  equals(events[7], "afterUpdate");
});
