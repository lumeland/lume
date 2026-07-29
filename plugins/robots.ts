import { aiRobots } from "../deps/ai_robots.ts";
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
  filename?: string;

  /** User-agent to allow */
  allow?: string[] | string;

  /** User-agent to disallow */
  disallow?: string[] | string;

  /** Custom rules */
  rules?: Rule[];

  /**
   * To block some known AI bots.
   * List of User Agents from https://github.com/ai-robots-txt/ai.robots.txt
   */
  disallowAI?: boolean;
}

// Default options
export const defaults = {
  filename: "/robots.txt",
  allow: "*",
} satisfies Options;

/**
 * A plugin to generate a robots.txt after build
 * @see https://lume.land/plugins/robots/
 */
export function robots(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  // AI bots
  if (options.disallowAI && options.disallow !== "*") {
    options.disallow = [
      ...toArray(options.disallow),
      ...aiRobots,
    ];

    if (options.allow === "*") {
      options.allow = [];
    }
  }

  // If disallow is *, allow can't be *
  if (options.disallow === "*" && options.allow === "*") {
    options.allow = [];
  }

  return (site: Site) => {
    site.process(async function processRobots() {
      const rules: Rule[] = [];
      const allow = toArray(options.allow);
      const disallow = toArray(options.disallow);
      if (allow.length > 0) {
        rules.push({ userAgent: allow, allow: "/" });
      }

      if (disallow.length > 0) {
        rules.push({ userAgent: disallow, disallow: "/" });
      }

      rules.push(...(options.rules ?? []));

      // Create the robots.txt page
      const robots = await site.getOrCreatePage(options.filename);
      const existingContent = robots.text ? `${robots.text}\n` : "";

      robots.text = existingContent + rules
        .map((rule) =>
          Object.entries(rule)
            .sort(([keyA], [keyB]) =>
              ruleSort.indexOf(keyA) - ruleSort.indexOf(keyB)
            )
            .map(([key, value]) =>
              toArray(value).map((item) => `${formatRuleName(key)}: ${item}`)
                .join("\n")
            ).join("\n")
        ).join("\n\n") +
        "\n";
    });
  };
}

export default robots;

function toArray(value?: string | string[]): string[] {
  return !value ? [] : typeof value === "string" ? [value] : value;
}

/** Convert 'userAgent' to 'User-agent' */
function formatRuleName(name: string): string {
  return `${name.charAt(0).toUpperCase()}${
    name.slice(1).replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()
  }`;
}
