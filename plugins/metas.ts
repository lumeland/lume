import { getLumeVersion, merge } from "../core/utils.ts";

import type { Page, Site } from "../core.ts";
import type { HTMLDocument } from "../deps/dom.ts";

export interface Options {
  /** The list extensions this plugin applies to */
  extensions: string[];

  /** The key name for the transformations definitions */
  name: string;

  /** Use page data as meta data if the correspond metas value does not exists*/
  defaultPageData?: {
    [K in keyof MetaData]?: string;
  };
}

export interface MetaData {
  /** The name of the site */
  site: string;

  /** The title of the page */
  title: string;

  /** The page language */
  lang: string;

  /** The description of the page */
  description: string;

  /** The image of the page */
  image: string;

  /** The icon of the site */
  icon: string;

  /** The page keywords */
  keywords: string[];

  /** The twitter username */
  twitter: string;

  /** The color theme */
  color: string;

  /** Robots configuration (Boolean to enable/disable, String for a custom value) */
  robots: string | boolean;

  /** Whether include the generator or not (Boolean to enable/disable, String for a custom value) */
  generator: string | boolean;
}

const defaults: Options = {
  extensions: [".html"],
  name: "metas",
};

const defaultGenerator = `Lume ${getLumeVersion()}`;

/** A plugin to insert meta tags for SEO and social media */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.process(options.extensions, metas);

    function metas(page: Page) {
      const metas = page.data[options.name] as MetaData | undefined;

      if (!metas || !page.document) {
        return;
      }

      const getMetaValue = <T extends keyof MetaData>(key: T) => {
        if (key in metas) {
          return metas[key];
        }
        if (options.defaultPageData && key in options.defaultPageData) {
          const pageKey = options.defaultPageData[key];
          if (pageKey) {
            return page.data[pageKey] as MetaData[T];
          }
        }
      };

      const { document } = page;
      const metaIcon = getMetaValue("icon");
      const metaImage = getMetaValue("image");
      const url = site.url(page.data.url as string, true);
      const icon = metaIcon ? new URL(site.url(metaIcon), url).href : undefined;
      const image = metaImage
        ? new URL(site.url(metaImage), url).href
        : undefined;

      const site_name = getMetaValue("site");
      const lang = getMetaValue("lang");
      const title = getMetaValue("title");
      const description = getMetaValue("description");
      const twitter = getMetaValue("twitter");
      const keywords = getMetaValue("keywords");
      const robots = getMetaValue("robots");
      const color = getMetaValue("color");
      const generator = getMetaValue("generator");

      // Open graph
      addMeta(document, "property", "og:type", "website");
      addMeta(document, "property", "og:site_name", site_name);
      addMeta(document, "property", "og:locale", lang);
      addMeta(document, "property", "og:title", title, 65);
      addMeta(document, "property", "og:description", description, 155);
      addMeta(document, "property", "og:url", url);
      addMeta(document, "property", "og:image", image || icon);

      // Twitter cards
      addMeta(document, "name", "twitter:title", title, 65);
      addMeta(document, "name", "twitter:description", description, 200);
      addMeta(
        document,
        "name",
        "twitter:card",
        image ? "summary_large_image" : "summary",
      );
      addMeta(document, "name", "twitter:image", image || icon);
      addMeta(document, "name", "twitter:site", twitter);

      // Schema.org
      addMeta(document, "itemprop", "name", title);
      addMeta(document, "itemprop", "description", description, 155);
      addMeta(document, "itemprop", "image", image || icon);

      // SEO
      addMeta(document, "name", "description", description, 155);
      addMeta(document, "name", "keywords", keywords?.join(", "));

      if (robots === true) {
        addMeta(document, "name", "robots", "index, follow");
      } else if (robots === false) {
        addMeta(document, "name", "robots", "noindex, nofollow, noarchive");
      } else if (robots) {
        addMeta(document, "name", "robots", robots);
      }

      // Misc
      addMeta(document, "name", "theme-color", color);

      if (generator) {
        addMeta(
          document,
          "name",
          "generator",
          generator === true ? defaultGenerator : generator,
        );
      }
    }
  };
}

function addMeta(
  document: HTMLDocument,
  propName: string,
  propValue: string,
  content?: string,
  limit?: number,
) {
  if (!content) {
    return;
  }
  content = content.trim();

  if (limit && content.length > limit) {
    content = content.substr(0, limit - 1).trimEnd() + "…";
  }

  const meta = document.createElement("meta");
  meta.setAttribute(propName, propValue);
  meta.setAttribute("content", content);
  document.head.appendChild(meta);
  document.head.appendChild(document.createTextNode("\n"));
}
