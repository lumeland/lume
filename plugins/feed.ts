import {
  DeepPartial,
  getExtension,
  getLumeVersion,
  merge,
} from "../core/utils.ts";
import { getDataValue } from "./utils.ts";
import { $XML, stringify } from "../deps/xml.ts";
import { Page } from "../core/filesystem.ts";

import type { Data, Site } from "../core.ts";

export interface Options {
  /** The output filenames */
  output: string | string[];

  /** The query to search the pages */
  query: string;

  /** The sort order */
  sort: string;

  /** The maximum number of items */
  limit: number;

  /** The feed info */
  info: FeedInfoOptions;

  /** The feed items configuration */
  items: FeedItemOptions;
}

export interface FeedInfoOptions {
  /** The feed title */
  title: string;

  /** The feed subtitle */
  subtitle?: string;

  /**
   * The feed published date
   * @default `new Date()`
   */
  date: Date;

  /** The feed description */
  description: string;

  /** The feed language */
  lang: string;

  /** The feed generator. Set `true` to generate automatically */
  generator: string | boolean;
}

export interface FeedItemOptions {
  /** The item title */
  title: string;

  /** The item description */
  description: string;

  /** The item date */
  date: string;

  /** The item content */
  content: string;

  /** The item language */
  lang: string;
}

export const defaults: Options = {
  /** The output filenames */
  output: "/feed.rss",

  /** The query to search the pages */
  query: "",

  /** The sort order */
  sort: "date=desc",

  /** The maximum number of items */
  limit: 10,

  /** The feed info */
  info: {
    title: "My RSS Feed",
    date: new Date(),
    description: "",
    lang: "en",
    generator: true,
  },
  items: {
    title: "=title",
    description: "=description",
    date: "=date",
    content: "=children",
    lang: "=lang",
  },
};

export interface FeedData {
  title: string;
  url: string;
  description: string;
  date: Date;
  lang: string;
  generator?: string;
  items: FeedItem[];
}

export interface FeedItem {
  title: string;
  url: string;
  description: string;
  date: Date;
  content: string;
  lang: string;
}

const defaultGenerator = `Lume ${getLumeVersion()}`;

export default function (userOptions?: DeepPartial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.addEventListener("beforeSave", () => {
      const output = Array.isArray(options.output)
        ? options.output
        : [options.output];

      const pages = site.searcher.pages(
        options.query,
        options.sort,
        options.limit,
      ) as Data[];

      const { info, items } = options;
      const rootData = site.source.data.get("/") || {};

      const feed: FeedData = {
        title: getDataValue(rootData, info.title),
        description: getDataValue(rootData, info.description),
        date: getDataValue(rootData, info.date),
        lang: getDataValue(rootData, info.lang),
        url: site.url("", true),
        generator: info.generator === true
          ? defaultGenerator
          : info.generator || undefined,
        items: pages.map((data): FeedItem => {
          const content = getDataValue(data, items.content)?.toString();
          const pageUrl = site.url(data.url as string, true);
          const fixedContent = fixUrls(new URL(pageUrl), content || "");

          return {
            title: getDataValue(data, items.title),
            url: site.url(data.url as string, true),
            description: getDataValue(data, items.description),
            date: getDataValue(data, items.date),
            content: fixedContent,
            lang: getDataValue(data, items.lang),
          };
        }),
      };

      for (const filename of output) {
        const format = getExtension(filename).slice(1);
        const file = site.url(filename, true);

        switch (format) {
          case "rss":
          case "feed":
          case "xml":
            site.pages.push(Page.create(filename, generateRss(feed, file)));
            break;

          case "json":
            site.pages.push(Page.create(filename, generateJson(feed, file)));
            break;

          default:
            throw new Error(`Invalid Feed format "${format}"`);
        }
      }
    });
  };
}

function fixUrls(base: URL, html: string): string {
  return html.replaceAll(
    /\s(href|src)="([^"]+)"/g,
    (_match, attr, value) => ` ${attr}="${new URL(value, base).href}"`,
  );
}

function generateRss(data: FeedData, file: string): string {
  const feed = {
    [$XML]: { cdata: [["rss", "channel", "item", "content:encoded"]] },
    xml: {
      "@version": "1.0",
      "@encoding": "UTF-8",
    },
    rss: {
      "@xmlns:content": "http://purl.org/rss/1.0/modules/content/",
      "@xmlns:wfw": "http://wellformedweb.org/CommentAPI/",
      "@xmlns:dc": "http://purl.org/dc/elements/1.1/",
      "@xmlns:atom": "http://www.w3.org/2005/Atom",
      "@xmlns:sy": "http://purl.org/rss/1.0/modules/syndication/",
      "@xmlns:slash": "http://purl.org/rss/1.0/modules/slash/",
      "@version": "2.0",
      channel: {
        title: data.title,
        link: data.url,
        "atom:link": {
          "@href": file,
          "@rel": "self",
          "@type": "application/rss+xml",
        },
        description: data.description,
        lastBuildDate: data.date.toUTCString(),
        language: data.lang,
        generator: data.generator,
        item: data.items.map((item) => ({
          title: item.title,
          link: item.url,
          guid: {
            "@isPermaLink": false,
            "#text": item.url,
          },
          description: item.description,
          "content:encoded": item.content,
          pubDate: item.date.toUTCString(),
        })),
      },
    },
  };

  return stringify(feed);
}

function generateJson(data: FeedData, file: string): string {
  const feed = {
    version: "https://jsonfeed.org/version/1",
    title: data.title,
    home_page_url: data.url,
    feed_url: file,
    description: data.description,
    items: data.items.map((item) => ({
      id: item.url,
      url: item.url,
      title: item.title,
      content_html: item.content,
      date_published: item.date.toUTCString(),
    })),
  };

  return JSON.stringify(feed);
}
