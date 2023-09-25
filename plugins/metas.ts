import { getLumeVersion, merge } from "../core/utils.ts";
import { getDataValue } from "./utils.ts";

import type { Page, Plugin, Site } from "../core.ts";
import type { HTMLDocument } from "../deps/dom.ts";

export interface Options {
  /** The list extensions this plugin applies to */
  extensions: string[];

  /** The key name for the transformations definitions */
  name: string;
}

export interface MetaData {
  /** The type of the site default is website */
  type: string;

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
export default function (userOptions?: Partial<Options>): Plugin {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    // Configure the merged keys
    site.mergeKey(options.name, "object");
    site.process(options.extensions, metas);

    function metas(page: Page) {
      const metas = page.data[options.name] as MetaData | undefined;

      if (!metas || !page.document) {
        return;
      }

      const { document, data } = page;
      const metaIcon = getDataValue(data, metas["icon"]);
      const metaImage = getDataValue(data, metas["image"]);

      const url = site.url(page.data.url as string, true);
      const icon = metaIcon ? new URL(site.url(metaIcon), url).href : undefined;
      const image = metaImage
        ? new URL(site.url(metaImage), url).href
        : undefined;

      const type = getDataValue(data, metas["type"]);
      const site_name = getDataValue(data, metas["site"]);
      const lang = getDataValue(data, metas["lang"]);
      const title = getDataValue(data, metas["title"]);
      const description = getDataValue(data, metas["description"]);
      const twitter = getDataValue(data, metas["twitter"]);
      const keywords = getDataValue(data, metas["keywords"]);
      const robots = getDataValue(data, metas["robots"]);
      const color = getDataValue(data, metas["color"]);
      const generator = getDataValue(data, metas["generator"]);

      // Open graph
      addMeta(document, "property", "og:type", type || "website");
      addMeta(document, "property", "og:site_name", site_name);
      addMeta(document, "property", "og:locale", lang);
      addMeta(document, "property", "og:title", title, 65);
      addMeta(document, "property", "og:description", description, 155);
      addMeta(document, "property", "og:url", url);
      addMeta(document, "property", "og:image", image || icon);

      // Twitter cards
      addMeta(
        document,
        "name",
        "twitter:card",
        image ? "summary_large_image" : "summary",
      );
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
  content = content
    .replaceAll(/<[^>]*>/g, "")
    .replaceAll(/\s+/g, " ")
    .trim();

  if (limit && content.length > limit) {
    content = content.substr(0, limit - 1).trimEnd() + "…";
  }

  const meta = document.createElement("meta");
  meta.setAttribute(propName, propValue);
  meta.setAttribute("content", content);
  document.head.appendChild(meta);
  document.head.appendChild(document.createTextNode("\n"));
}
