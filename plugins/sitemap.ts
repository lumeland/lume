import { merge } from "../core/utils.ts";
import { Page } from "../core/filesystem.ts";
import { Search } from "../plugins/search.ts";

import type { Data, Site, StaticFile } from "../core.ts";

export interface Options {
  /** The sitemap file name */
  filename: string;

  /** The query to search pages included in the sitemap */
  query: string;

  /** The values to sort the sitemap */
  sort: string;
}

// Default options
export const defaults: Options = {
  filename: "/sitemap.xml",
  query: "",
  sort: "url=asc",
};

/** A plugin to generate a sitemap.xml from page files after build */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.addEventListener("afterRender", () => {
      // Create the sitemap.xml page
      const sitemap = Page.create(options.filename, getSitemapContent(site));

      // Add to the sitemap page to pages
      site.pages.push(sitemap);

      // Search for the `robots.txt` file
      const robots = site.files.some((file: StaticFile) =>
        file.dest === "/robots.txt"
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
            `User-agent: *\nAllow: /\n\nSitemap: ${
              site.url("/sitemap.xml", true)
            }`,
          ));
        }
      }
    });

    function getSitemapContent(site: Site) {
      const search = new Search(site, true);
      const sitemap = search.pages(options.query, options.sort) as Data[];

      // deno-fmt-ignore
      return `
<?xml version="1.0" encoding="utf-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${sitemap.map((data: Data) =>
  `<url>
    <loc>${site.url(data.url as string, true)}</loc>
    ${data.date ? `<lastmod>${data.date.toISOString()}</lastmod>` : ""}
  </url>
  `).join("").trim()}
</urlset>`.trim();
    }
  };
}
