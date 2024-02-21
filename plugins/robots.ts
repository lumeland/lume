import { merge } from "../core/utils/object.ts";

import type Site from "../core/site.ts";

type Rule = {
  /** User-agent */
  userAgent?: string;
  /** Crawl-delay */
  crawlDelay?: string;
  /** Disallow */
  disallow?: string;
  /** Disavow */
  disavow?: string;
  /** Allow */
  allow?: string;
  /** Host */
  host?: string;
  /** Sitemap */
  sitemap?: string;
  /** Clean-param */
  cleanParam?: string;
};

const ruleSort = [
  "userAgent",
  "crawlDelay",
  "disallow",
  "disavow",
  "allow",
  "host",
  "sitemap",
  "cleanParam",
];

export interface Options {
  /** The robots.txt file name */
  filename: string;
  allow?: string[] | string;
  disallow?: string[] | string;
  rules?: Rule[];
}

// Default options
export const defaults: Options = {
  filename: "/robots.txt",
  allow: "*",
};

/** A plugin to generate a robots.txt after build */
export default (userOptions?: Partial<Options>) => {
  const options: Options = merge(defaults, userOptions);

  return (site: Site) => {
    site.addEventListener("beforeSave", async () => {
      const rules: Rule[] = [];
      const allow = typeof options.allow === "string"
        ? [options.allow]
        : options.allow;
      const disallow = typeof options.disallow === "string"
        ? [options.disallow]
        : options.disallow;

      allow?.forEach((userAgent) =>
        rules.push({
          userAgent,
          allow: "/",
        })
      );

      disallow?.forEach((userAgent) =>
        rules.push({
          userAgent,
          disallow: "/",
        })
      );

      rules.push(...(options.rules ?? []));

      // Create the robots.txt page
      const robots = await site.getOrCreatePage(options.filename);
      const existingContent = robots.content ? `${robots.content}\n` : "";

      robots.content = existingContent + rules
        .map((rule) =>
          Object.entries(rule)
            .sort(([keyA], [keyB]) =>
              ruleSort.indexOf(keyA) - ruleSort.indexOf(keyB)
            )
            .map(([key, value]) =>
              `${key.charAt(0).toUpperCase()}${
                key.slice(1).replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()
              }: ${value}`
            )
            .join("\n")
        ).join("\n\n");
    });
  };
};
