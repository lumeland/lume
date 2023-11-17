import { merge } from "../core/utils/object.ts";
import { Page } from "../core/file.ts";
import { stringify } from "../deps/xml.ts";

import type Site from "../core/site.ts";
import type { Data, StaticFile } from "../core/file.ts";

type ChangeFreq =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export interface Options {
  /** The sitemap file name */
  filename?: string;

  /** The query to search pages included in the sitemap */
  query?: string;

  /** The values to sort the sitemap */
  sort?: string;

  /** The key to use for the lastmod field or a custom function */
  lastmod?: string | ((data: Data) => Date);

  /** The key to use for the changefreq field or a custom function */
  changefreq?: string | ((data: Data) => ChangeFreq);

  /** The key to use for the priority field or a custom function */
  priority?: string | ((data: Data) => number);
}

// Default options
export const defaults: Options = {
  filename: "/sitemap.xml",
  query: "",
  sort: "url=asc",
  lastmod: "date",
};

/** A plugin to generate a sitemap.xml from page files after build */
export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.addEventListener("afterRender", () => {
      // Create the sitemap.xml page
      const sitemap = Page.create(
        options.filename,
        {
          content: generateSitemap(
            site.searcher.pages(options.query, options.sort),
          ),
        },
      );

      // Add to the sitemap page to pages
      site.pages.push(sitemap);

      // Search for the `robots.txt` file
      const robots = site.files.some((file: StaticFile) =>
        file.outputPath === "/robots.txt"
      );

      // If the `robots.txt` file doesn't exist, create it
      if (!robots) {
        const robots = site.pages.find((page: Page) =>
          page.data.url === "/robots.txt"
        );

        if (robots) {
          robots.content += `Sitemap: ${site.url(options.filename, true)}`;
        } else {
          site.pages.push(Page.create(
            "/robots.txt",
            {
              content: `User-agent: *\nAllow: /\n\nSitemap: ${
                site.url("/sitemap.xml", true)
              }`,
            },
          ));
        }
      }
    });

    function generateSitemap(pages: Data[]): string {
      const sitemap = {
        xml: {
          "@version": "1.0",
          "@encoding": "UTF-8",
        },
        urlset: {
          "@xmlns": "http://www.sitemaps.org/schemas/sitemap/0.9",
          url: pages.map((data) => {
            const node: UrlItem = {
              loc: site.url(data.url as string, true),
            };

            const lastmod = getValue<Date>(data, options.lastmod)
              ?.toISOString();
            if (lastmod) {
              node.lastmod = lastmod;
            }

            const changefreq = getValue<ChangeFreq>(data, options.changefreq);
            if (changefreq) {
              node.changefreq = changefreq;
            }

            const priority = getValue<number>(data, options.priority);
            if (priority) {
              node.priority = priority;
            }

            if (data.alternates?.length) {
              node["xhtml:link"] = data.alternates.map((alternate: Data) => ({
                "@rel": "alternate",
                "@hreflang": alternate.lang,
                "@href": site.url(alternate.url as string, true),
              }));
            }
            return node;
          }),
        },
      };

      return stringify(sitemap);
    }
  };
}

interface UrlItem {
  loc: string;
  lastmod?: string;
  changefreq?: ChangeFreq;
  priority?: number;
  "xhtml:link"?: {
    "@rel": "alternate";
    "@hreflang": string;
    "@href": string;
  }[];
}

function getValue<T>(
  data: Data,
  key?: string | ((data: Data) => T),
): T | undefined {
  if (!key) {
    return undefined;
  }

  if (typeof key === "function") {
    return key(data);
  }

  return data[key];
}
