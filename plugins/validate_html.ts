import {
  ConfigData,
  formatterFactory,
  HtmlValidate,
  Report,
  Reporter,
} from "../deps/html_validate.ts";
import { green } from "../deps/colors.ts";
import { merge } from "../core/utils/object.ts";
import { log } from "../core/utils/log.ts";

export interface Config {
  /**
   * List of plugins to load
   * @link https://html-validate.org/usage/#plugins
   */
  plugins?: ConfigData["plugins"];

  /**
   * List of configuration presets to extend.
   * @link https://html-validate.org/usage/#extends
   */
  extends?: string[];

  /**
   * Rules configuration
   * @link https://html-validate.org/usage/#rules
   */
  rules?: ConfigData["rules"];

  /** Customize the report output */
  output?: string | ((report: Report) => void);
}

export const defaults: Config = {
  extends: ["html-validate:recommended", "html-validate:document"],
  rules: {
    "doctype-style": "off",
    "attr-quotes": "off",
    "no-trailing-whitespace": "off",
    "void-style": "warn",
    "require-sri": ["error", { target: "crossorigin" }],
  },
};

export function validateHtml(userOptions?: Config) {
  const options = merge(defaults, userOptions);
  const htmlvalidate = new HtmlValidate({
    plugins: options.plugins,
    rules: options.rules,
    extends: options.extends,
  });

  return (site: Lume.Site) => {
    site.process([".html"], processValidateHtml);

    async function processValidateHtml(pages: Lume.Page[]) {
      const reports: Set<Report> = new Set();
      for (const page of pages) {
        const report = await htmlvalidate.validateString(
          page.text,
          page.data.url,
        );
        reports.add(report);
      }

      const merged = Reporter.merge(Array.from(reports.values()));

      // Output
      if (typeof options.output === "function") {
        options.output(merged);
      } else if (typeof options.output === "string") {
        outputFile(merged, options.output);
      } else {
        outputConsole(merged);
      }

      const report = site.debugBar?.collection("HTML validator");
      if (report) {
        report.icon = "file-html";
        report.empty = "No HTML errors found! 🎉";

        for (const result of merged.results) {
          report.items.push({
            title: result.filePath!,
            items: Array.from(result.messages).map((message) => {
              const actions = message.ruleUrl
                ? [{ text: "Info", href: message.ruleUrl, target: "_blank" }]
                : [];
              return {
                title: `[${message.ruleId}] ${escapeHtml(message.message)}`,
                details: `Line ${message.line}, Column ${message.column}`,
                code: message.selector ?? undefined,
                actions,
              };
            }),
            actions: [
              {
                text: "Open",
                href: result.filePath!,
              },
            ],
          });
        }
      }
    }
  };
}

function outputFile(
  reports: Report,
  file: string,
) {
  const content = JSON.stringify(
    reports,
    null,
    2,
  );
  Deno.writeTextFileSync(file, content);

  if (reports.valid) {
    log.info("No HTML errors found!");
  } else {
    log.info(
      `⛓️‍💥 ${reports.errorCount} validation errors saved to <gray>${file}</gray>`,
    );
  }
}

function outputConsole(reports: Report) {
  if (reports.valid) {
    console.log(green("[validateHTML] Validation successful!"));
    return;
  }

  const format = formatterFactory("text");
  console.error("[validateHTML]:\n" + format(reports.results));
  console.error("");
}

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export default validateHtml;
