import { getDataValue } from "../core/utils/data_values.ts";
import { merge } from "../core/utils/object.ts";
import { Page } from "../core/file.ts";
import { stringify } from "../deps/xml.ts";

import type Site from "../core/site.ts";
import type { Data } from "../core/file.ts";
import type { stringifyable } from "../deps/xml.ts";

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

  /** The xml-stylesheet document for styling */
  stylesheet?: string;

  /**
   * The query to search pages included in the sitemap
   * @default "unlisted!=true" excludes pages with the `unlisted` property
   */
  query?: string;

  /** The values to sort the sitemap */
  sort?: string;

  items?: SitemapItemsOptions;
}

export interface SitemapItemsOptions {
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
  query: "unlisted!=true",
  sort: "url=asc",
  items: {
    lastmod: "=date",
  },
};

/**
 * A plugin to generate a sitemap.xml from page files after build
 * @see https://lume.land/plugins/sitemap/
 */
export function sitemap(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.process(async () => {
      // Create the sitemap.xml page
      const sitemap = Page.create({
        url: options.filename,
        content: generateSitemap(
          site.search.pages(options.query, options.sort),
        ),
      });

      // Add the sitemap page to pages
      site.pages.push(sitemap);

      // Add or update `robots.txt` with the sitemap url
      const robots = await site.getOrCreatePage("/robots.txt");
      const content = robots.content as string || `User-agent: *\nAllow: /\n`;
      robots.content = `${content}\nSitemap: ${
        site.url(options.filename, true)
      }`;
    });

    function generateSitemap(pages: Data[]): string {
      const items = options.items ?? {};
      const sitemap: stringifyable = {
        "@version": "1.0",
        "@encoding": "UTF-8",
        urlset: {
          "@xmlns": "http://www.sitemaps.org/schemas/sitemap/0.9",
          "@xmlns:xhtml": "http://www.w3.org/1999/xhtml",
          url: pages.map((data) => {
            const node: UrlItem = {
              loc: site.url(data.url, true),
            };

            const lastmod = getDataValue(data, items.lastmod);
            if (lastmod instanceof Date) {
              node.lastmod = lastmod.toISOString();
            }

            const changefreq = getDataValue(data, items.changefreq);
            if (changefreq) {
              node.changefreq = changefreq;
            }

            const priority = getDataValue(data, items.priority);
            if (typeof priority === "number") {
              node.priority = priority;
            }

            if (data.alternates?.length) {
              node["xhtml:link"] = data.alternates.map((alternate: Data) => ({
                "@rel": "alternate",
                "@hreflang": alternate.lang!,
                "@href": site.url(alternate.url, true),
              }));
            }
            if (data.unmatchedLangUrl) {
              node["xhtml:link"]?.push({
                "@rel": "alternate",
                "@hreflang": "x-default",
                "@href": site.url(data.unmatchedLangUrl, true),
              });
            }

            return node;
          }),
        },
      };

      if (options.stylesheet) {
        sitemap["#instructions"] = {
          "xml-stylesheet": {
            "@href": options.stylesheet,
            "@type": "text/xsl",
          },
        };
      }

      const result = stringify(sitemap);
      return options.stylesheet
        ? result.replace(
          '<?xml version="1.0" encoding="UTF-8"?>',
          `<?xml version="1.0" encoding="UTF-8"?>\n<?xml-stylesheet type="text/xsl" href="${
            site.url(options.stylesheet)
          }"?>`,
        )
        : result;
    }
  };
}

export default sitemap;

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
