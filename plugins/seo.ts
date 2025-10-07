import { green } from "../deps/colors.ts";
import { merge } from "../core/utils/object.ts";
import { log } from "../core/utils/log.ts";
import { validateSEO } from "./seo/mod.ts";
import { Options as SeoOptions } from "./seo/mod.ts";
import messages from "./seo/messages.json" with { type: "json" };
import enCommonWords from "./seo/cw/en.json" with { type: "json" };

import type { ErrorMessage } from "./seo/mod.ts";

const commonWords = new Set<string>(enCommonWords);

export interface Config {
  /** Customize the report output */
  output?: string | ((reports: Map<string, ErrorMessage[]>) => void);

  /** A query to filter the pages to validate */
  query?: string;

  /** Options for SEO validation per language */
  options?: Record<string, SeoOptions>;
}

export const defaults: Config = {
  options: {
    en: {
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
  },
};

export function SEO(userOptions?: Config) {
  const options = merge(defaults, userOptions);

  return (site: Lume.Site) => {
    site.process(processSEO);

    function processSEO() {
      const pages = site.search.pages(options.query);
      const reports: Map<string, ErrorMessage[]> = new Map();
      for (const page of pages) {
        const lang = page.lang ?? "en";
        const optionsLang = options.options?.[lang];
        if (!optionsLang) {
          continue;
        }
        const errors = validateSEO(
          page.page.document,
          page.url,
          lang,
          optionsLang,
        );
        if (errors.length) {
          reports.set(page.url, errors);
        }
      }

      // Output
      if (typeof options.output === "function") {
        options.output(reports);
      } else if (typeof options.output === "string") {
        outputFile(reports, options.output);
      } else {
        outputConsole(reports);
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
  const content = JSON.stringify(
    reports,
    null,
    2,
  );
  Deno.writeTextFileSync(file, content);

  if (reports.size === 0) {
    log.info("No SEO errors found!");
  } else {
    log.info(
      `⛓️‍💥 ${reports.size} SEO errors saved to <gray>${file}</gray>`,
    );
  }
}

function outputConsole(reports: Map<string, ErrorMessage[]>) {
  if (reports.size === 0) {
    console.log(green("[validateHTML] Validation successful!"));
    return;
  }

  for (const [url, errors] of reports.entries()) {
    console.error(url);
    for (const error of errors) {
      const { title } = getMessage(error);
      console.error(" - " + title);
    }
    console.error("");
  }
}

const errors = messages as Record<string, string>;
interface Message {
  title: string;
  text?: string;
}
function getMessage(error: ErrorMessage): Message {
  if (typeof error === "string") {
    return { title: errors[error] ?? error };
  }

  const { msg, text, ...params } = error;
  const template = errors[msg] ?? msg;

  const title = template.replace(
    /\{(\w+)\}/g,
    (match, key) => String(params[key] ?? match),
  );
  return { title, text };
}

export default SEO;
