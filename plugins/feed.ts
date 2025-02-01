import { getExtension } from "../core/utils/path.ts";
import { isPlainObject, merge } from "../core/utils/object.ts";
import { getGenerator } from "../core/utils/lume_version.ts";
import { getDataValue, getPlainDataValue } from "../core/utils/data_values.ts";
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

  /** The feed author name */
  authorName?: string;

  /** The feed author URL */
  authorUrl?: string;

  /** The main image of the site */
  image?: string;

  /** The logotype or icon of the site */
  icon?: string;

  /** The color theme of the site */
  color?: string;
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

  /** The item author name */
  authorName?: string;

  /** The item author URL */
  authorUrl?: string;
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

export interface Author {
  name?: string;
  url?: string;
}

export interface FeedData {
  title: string;
  url: string;
  description: string;
  published: Date;
  lang: string;
  generator?: string;
  items: FeedItem[];
  author?: Author;
  image?: string;
  icon?: string;
  color?: string;
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
  author?: Author;
}

const defaultGenerator = getGenerator();

/**
 * A plugin to generate RSS and JSON feeds
 * @see https://lume.land/plugins/feed/
 */
export function feed(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.process(() => {
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
        title: getPlainDataValue(rootData, info.title),
        description: getPlainDataValue(rootData, info.description),
        published: getDataValue(rootData, info.published),
        lang: getDataValue(rootData, info.lang),
        url: site.url("", true),
        generator: info.generator === true
          ? defaultGenerator
          : info.generator || undefined,
        author: getAuthor(rootData, info),
        image: info.image,
        icon: info.icon,
        color: info.color,
        items: pages.map((data): FeedItem => {
          const content = getDataValue(data, items.content)?.toString();
          const pageUrl = site.url(data.url, true);
          const fixedContent = fixUrls(new URL(pageUrl), content || "");
          const imagePath = getDataValue(data, items.image);
          const image = imagePath !== undefined
            ? site.url(imagePath, true)
            : undefined;

          return {
            title: getPlainDataValue(data, items.title),
            url: site.url(data.url, true),
            description: getPlainDataValue(data, items.description),
            author: getAuthor(data, items),
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

function getAuthor(
  data: Partial<Data>,
  info: FeedInfoOptions | FeedItemOptions,
): Author | undefined {
  const name = getPlainDataValue(data, info.authorName);
  const url = getDataValue(data, info.authorUrl);

  if (name || url) {
    return { name, url };
  }
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
      "@xmlns:webfeeds": "http://webfeeds.org/rss/1.0",
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
        lastBuildDate: data.published.toUTCString(),
        language: data.lang,
        generator: data.generator,
        author: {
          name: data.author?.name,
          uri: data.author?.url,
        },
        "webfeeds:cover": {
          "@image": data.image,
        },
        "webfeeds:logo": data.icon,
        "webfeeds:accentColor": data.color,
        item: data.items.map((item) => ({
          title: item.title,
          link: item.url,
          guid: {
            "@isPermaLink": false,
            "#text": item.url,
          },
          author: {
            name: item.author?.name,
            uri: item.author?.url,
          },
          description: item.description,
          "content:encoded": cdata(item.content),
          pubDate: item.published.toUTCString(),
          "atom:updated": item.updated?.toISOString(),
          meta: item.image
            ? { "@property": "og:image", "@content": item.image }
            : undefined,
        })),
      },
    },
  };

  return stringify(clean(feed));
}

function generateJson(data: FeedData, file: string): string {
  const feed = {
    version: "https://jsonfeed.org/version/1",
    title: data.title,
    home_page_url: data.url,
    feed_url: file,
    description: data.description,
    author: data.author,
    icon: data.image,
    favicon: data.icon,
    items: data.items.map((item) => ({
      id: item.url,
      url: item.url,
      title: item.title,
      author: item.author,
      content_html: item.content,
      date_published: item.published.toUTCString(),
      date_modified: item.updated?.toUTCString(),
      image: item.image,
    })),
  };

  return JSON.stringify(clean(feed));
}

/** Remove undefined values of an object recursively */
function clean(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj)
      .map(([key, value]): [string, unknown] => {
        if (isPlainObject(value)) {
          const cleanValue = clean(value);
          return [
            key,
            Object.keys(cleanValue).length > 0 ? cleanValue : undefined,
          ];
        }
        if (Array.isArray(value)) {
          const cleanValue = value
            .map((v) => isPlainObject(v) ? clean(v) : v)
            .filter((v) => v !== undefined);
          return [
            key,
            cleanValue.length > 0 ? cleanValue : undefined,
          ];
        }
        return [key, value];
      })
      .filter(([, value]) => value !== undefined),
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
