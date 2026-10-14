import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import feed from "../src/mod.ts";

describe("feed plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
      location: new URL("https://example.com/"),
    });

    site.use(
      feed<{ title: string }>({
        output: ["feed.json", "feed.rss", "feed.atom"],
        info: {
          published: new Date("2020-01-01"),
          generator: "https://lume.land",
          authorName: "Laura Rubio",
          icon: "https://example.com/icon.svg",
          image: "https://example.com/image.png",
          color: "#ff0000",
          hubs: ["https://example.com/hub1", "https://example.com/hub2"],
        },
        items: {
          title: (data) => data.title?.toUpperCase(),
          updated: "=date || $.date",
          published: "$.not-found || =published",
          lang: () => "gl",
          authorName: "=author.name",
          authorUrl: "=author.url",
        },
      }),
    );
    site.ignore("static.yml");

    expect(await build(site)).toMatchSnapshot();
  });

  it("should match site snapshot with array function", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
      location: new URL("https://example.com/"),
    });

    site.use(
      feed<{ title: string }>(() => [
        {
          output: ["feed1.json", "feed1.rss", "feed1.atom"],
          stylesheet: "/feed-style.xml",
          info: {
            published: new Date("2020-01-01"),
            generator: "https://lume.land",
            authorName: "Laura Rubio",
            icon: "https://example.com/icon.svg",
            image: "https://example.com/image.png",
            color: "#ff0000",
            hubs: ["https://example.com/hub1", "https://example.com/hub2"],
          },
          items: {
            title: (data) => data.title?.toUpperCase(),
            updated: "=date || $.date",
            published: "$.not-found || =published",
            lang: () => "gl",
            authorName: "=author.name",
            authorUrl: "=author.url",
          },
        },
        {
          output: ["feed2.json", "feed2.rss", "feed2.atom"],
          info: {
            published: new Date("2020-01-01"),
            generator: "https://lume.land",
            authorName: "Laura Rubio",
            icon: "https://example.com/icon.svg",
            image: "https://example.com/image.png",
            color: "#ff0000",
            hubs: ["https://example.com/hub1", "https://example.com/hub2"],
          },
          items: {
            title: (data) => data.title?.toUpperCase(),
            updated: "=date || $.date",
            published: "$.not-found || =published",
            lang: () => "gl",
            authorName: "=author.name",
            authorUrl: "=author.url",
          },
        },
      ]),
    );
    site.ignore("static.yml");

    expect(await build(site)).toMatchSnapshot();
  });
});
