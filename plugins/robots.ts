import { merge } from "../core/utils/object.ts";

import type Site from "../core/site.ts";

type Rule = {
  /** User-agent */
  userAgent?: string[] | string;
  /** Crawl-delay */
  crawlDelay?: string;
  /** Disallow */
  disallow?: string[] | string;
  /** Disavow */
  disavow?: string;
  /** Allow */
  allow?: string[] | string;
  /** Host */
  host?: string;
  /** Sitemap */
  sitemap?: string[] | string;
  /** Clean-param */
  cleanParam?: string;
  /** Content-signal */
  contentSignal?: string;
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

  /** User-agent to allow */
  allow?: string[] | string;

  /** User-agent to disallow */
  disallow?: string[] | string;

  /** Custom rules */
  rules?: Rule[];
}

// Default options
export const defaults: Options = {
  filename: "/robots.txt",
  allow: "*",
};

/**
 * A plugin to generate a robots.txt after build
 * @see https://lume.land/plugins/robots/
 */
export function robots(userOptions?: Partial<Options>) {
  const options: Options = merge(defaults, userOptions);

  return (site: Site) => {
    site.process(async function processRobots() {
      const rules: Rule[] = [];
      const allow = typeof options.allow === "string"
        ? [options.allow]
        : options.allow;
      const disallow = typeof options.disallow === "string"
        ? [options.disallow]
        : options.disallow;

      if (allow && allow.length > 0) {
        rules.push({ userAgent: allow, allow: "/" });
      }

      if (disallow && disallow.length > 0) {
        rules.push({ userAgent: disallow, disallow: "/" });
      }

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
              (typeof value === "string" ? [value] : value).map((item) =>
                `${key.charAt(0).toUpperCase()}${
                  key.slice(1).replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()
                }: ${item}`
              ).join("\n")
            ).join("\n")
        ).join("\n\n") +
        "\n";
    });
  };
}

export default robots;
