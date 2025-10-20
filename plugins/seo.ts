import { merge } from "../core/utils/object.ts";
import { log } from "../core/utils/log.ts";
import { refresh, validatePage } from "./seo/mod.ts";
import { Options as SeoOptions } from "./seo/mod.ts";
import messages from "./seo/messages.json" with { type: "json" };
import enCommonWords from "./seo/cw/en.json" with { type: "json" };

import type { ErrorMessage } from "./seo/mod.ts";
import { Item } from "../deps/debugbar.ts";

const commonWords = new Set<string>(enCommonWords);

export interface Config {
  /** Customize the report output */
  output?: false | string | ((reports: Map<string, ErrorMessage[]>) => void);

  /** A query to filter the pages to validate */
  query?: string;

  /** Options for SEO validation */
  options?: SeoOptions;
}

export const defaults: Config = {
  output: false,
  options: {
    commonWords,
    title: {
      maxCommonWords: 45,
      max: 80,
      unit: "grapheme",
    },
    h1: {
      maxCommonWords: 45,
      max: 80,
      unit: "grapheme",
    },
    description: {
      maxCommonWords: 55,
      min: 1,
      max: 2,
      unit: "sentence",
    },
    headingsOrder: true,
    duplicateTitles: true,
    duplicateDescription: true,
    imgAlt: {
      min: 2,
      max: 1500,
      unit: "character",
    },
    body: {
      maxCommonWords: 42,
      min: 1500,
      max: 30000,
      unit: "word",
    },
  },
};

export function SEO(userOptions?: Config) {
  const options = merge(defaults, userOptions);

  return (site: Lume.Site) => {
    const reports: Map<string, ErrorMessage[]> = new Map();

    site.process(processSEO);

    function output() {
      // Output
      const { output } = options;
      if (typeof output === "function") {
        output(reports);
      } else if (typeof output === "string") {
        outputFile(reports, output);
      } else {
        outputConsole(reports);
      }
    }

    site.addEventListener("afterUpdate", output);
    site.addEventListener("afterBuild", output);

    function processSEO() {
      reports.clear();
      refresh();
      const pages = site.search.pages(options.query);
      for (const page of pages) {
        const errors = validatePage(
          page.page.document,
          page.url,
          page.lang ?? "en",
          options.options,
        );
        if (errors.length) {
          reports.set(page.url, errors);
        }
      }

      const report = site.debugBar?.collection("SEO");
      if (report) {
        report.icon = "list-magnifying-glass";
        report.empty = "No SEO errors found! 🎉";

        for (const [url, errors] of reports.entries()) {
          report.items.push({
            title: url,
            items: errors.map(getMessage),
            actions: [
              {
                text: "Open",
                href: url,
              },
            ],
          });
        }
      }
    }
  };
}

function outputFile(
  reports: Map<string, ErrorMessage[]>,
  file: string,
) {
  const json = [];

  for (const [url, errors] of reports.entries()) {
    json.push({
      url,
      errors: errors.map(getMessage),
    });
  }

  const content = JSON.stringify(
    json,
    null,
    2,
  );

  Deno.writeTextFileSync(file, content);

  if (reports.size === 0) {
    log.info("[seo plugin] No errors found!");
    return;
  }

  log.warn(
    `[seo plugin] ${reports.size} SEO error(s) saved to <gray>${file}</gray>`,
  );
}

function outputConsole(reports: Map<string, ErrorMessage[]>) {
  if (reports.size === 0) {
    log.info("[seo plugin] No errors found!");
    return;
  }

  log.warn(
    `[seo plugin] ${reports.size} SEO error(s) found. Setup an output file or check the debug bar.`,
  );
}

const errors = messages as Record<string, string>;
interface Message {
  title: string;
  text?: string;
  items?: Item[];
}
function getMessage(error: ErrorMessage): Message {
  if (typeof error === "string") {
    return { title: errors[error] ?? error };
  }

  const { msg, text, items, ...params } = error;
  const template = errors[msg] ?? msg;

  const title = template.replace(
    /\{(\w+)\}/g,
    (match, key) => String(params[key] ?? match),
  );

  return {
    title,
    text,
    items: items?.map((item) => ({ title: item })),
  };
}

export default SEO;
