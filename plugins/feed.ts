import { getExtension } from "../core/utils/path.ts";
import { merge } from "../core/utils/object.ts";
import { getCurrentVersion } from "../core/utils/lume_version.ts";
import { getDataValue } from "../core/utils/data_values.ts";
import { cdata, stringify } from "../deps/xml.ts";
import { Page } from "../core/file.ts";
import { parseDate } from "../core/utils/date.ts";

import type Site from "../core/site.ts";
import type { Data } from "../core/file.ts";

export interface Options {
  /** The output filenames */
  output?: string | string[];

  /** The query to search the pages */
  query?: string;

  /** The sort order */
  sort?: string;

  /** The maximum number of items */
  limit?: number;

  /** The feed info */
  info?: FeedInfoOptions;

  /** The feed items configuration */
  items?: FeedItemOptions;
}

export interface FeedInfoOptions {
  /** The feed title */
  title?: string;

  /** The feed subtitle */
  subtitle?: string;

  /**
   * The feed published date
   * @default `new Date()`
   */
  published?: Date;

  /** The feed description */
  description?: string;

  /** The feed language */
  lang?: string;

  /** The feed generator. Set `true` to generate automatically */
  generator?: string | boolean;
}

export interface FeedItemOptions {
  /** The item title */
  title?: string | ((data: Data) => string | undefined);

  /** The item description */
  description?: string | ((data: Data) => string | undefined);

  /** The item published date */
  published?: string | ((data: Data) => Date | undefined);

  /** The item updated date */
  updated?: string | ((data: Data) => Date | undefined);

  /** The item content */
  content?: string | ((data: Data) => string | undefined);

  /** The item language */
  lang?: string | ((data: Data) => string | undefined);

  /** The item image */
  image?: string | ((data: Data) => string | undefined);
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
    published: new Date(),
    description: "",
    lang: "en",
    generator: true,
  },
  items: {
    title: "=title",
    description: "=description",
    published: "=date",
    content: "=children",
    lang: "=lang",
  },
};

export interface FeedData {
  title: string;
  url: string;
  description: string;
  published: Date;
  lang: string;
  generator?: string;
  items: FeedItem[];
}

export interface FeedItem {
  title: string;
  url: string;
  description: string;
  published: Date;
  updated?: Date;
  content: string;
  lang: string;
  image?: string;
}

const defaultGenerator = `Lume ${getCurrentVersion()}`;

/**
 * A plugin to generate RSS and JSON feeds
 * @see https://lume.land/plugins/feed/
 */
export function feed(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.addEventListener("beforeSave", () => {
      const output = Array.isArray(options.output)
        ? options.output
        : [options.output];

      const pages = site.search.pages(
        options.query,
        options.sort,
        options.limit,
      ) as Data[];

      const { info, items } = options;
      const rootData = site.source.data.get("/") || {};

      const feed: FeedData = {
        title: getDataValue(rootData, info.title),
        description: getDataValue(rootData, info.description),
        published: getDataValue(rootData, info.published),
        lang: getDataValue(rootData, info.lang),
        url: site.url("", true),
        generator: info.generator === true
          ? defaultGenerator
          : info.generator || undefined,
        items: pages.map((data): FeedItem => {
          const content = getDataValue(data, items.content)?.toString();
          const pageUrl = site.url(data.url, true);
          const fixedContent = fixUrls(new URL(pageUrl), content || "");
          const imagePath = getDataValue(data, items.image);
          const image = imagePath !== undefined
            ? site.url(imagePath, true)
            : undefined;

          return {
            title: getDataValue(data, items.title),
            url: site.url(data.url, true),
            description: getDataValue(data, items.description),
            published: toDate(getDataValue(data, items.published)) ||
              new Date(),
            updated: toDate(getDataValue(data, items.updated)),
            content: fixedContent,
            lang: getDataValue(data, items.lang),
            image,
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
            site.pages.push(
              Page.create({ url: filename, content: generateRss(feed, file) }),
            );
            break;

          case "json":
            site.pages.push(
              Page.create({ url: filename, content: generateJson(feed, file) }),
            );
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
    "@version": "1.0",
    "@encoding": "UTF-8",
    rss: {
      "@xmlns:content": "http://purl.org/rss/1.0/modules/content/",
      "@xmlns:wfw": "http://wellformedweb.org/CommentAPI/",
      "@xmlns:dc": "http://purl.org/dc/elements/1.1/",
      "@xmlns:atom": "http://www.w3.org/2005/Atom",
      "@xmlns:sy": "http://purl.org/rss/1.0/modules/syndication/",
      "@xmlns:slash": "http://purl.org/rss/1.0/modules/slash/",
      "@version": "2.0",
      channel: clean({
        title: data.title,
        link: data.url,
        "atom:link": {
          "@href": file,
          "@rel": "self",
          "@type": "application/rss+xml",
        },
        description: data.description,
        lastBuildDate: data.published.toUTCString(),
        language: data.lang,
        generator: data.generator,
        item: data.items.map((item) =>
          clean({
            title: item.title,
            link: item.url,
            guid: {
              "@isPermaLink": false,
              "#text": item.url,
            },
            description: item.description,
            "content:encoded": cdata(item.content),
            pubDate: item.published.toUTCString(),
            "atom:updated": item.updated?.toISOString(),
            meta: item.image
              ? { "@property": "og:image", "@content": item.image }
              : undefined,
          })
        ),
      }),
    },
  };

  return stringify(feed);
}

function generateJson(data: FeedData, file: string): string {
  const feed = clean({
    version: "https://jsonfeed.org/version/1",
    title: data.title,
    home_page_url: data.url,
    feed_url: file,
    description: data.description,
    items: data.items.map((item) =>
      clean({
        id: item.url,
        url: item.url,
        title: item.title,
        content_html: item.content,
        date_published: item.published.toUTCString(),
        date_modified: item.updated?.toUTCString(),
        image: item.image,
      })
    ),
  });

  return JSON.stringify(feed);
}

/** Remove undefined values of an object */
function clean(obj: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  );
}

function toDate(date?: string | number | Date): Date | undefined {
  if (date instanceof Date) {
    return date;
  }
  if (date === undefined) {
    return;
  }
  return parseDate(date);
}

export default feed;
