import { merge } from "../core/utils/object.ts";
import { read } from "../core/utils/read.ts";
import { insertContent } from "../core/utils/page_content.ts";
import { cwd } from "../services/process.ts";
import {
  BetterMap,
  createGenerator,
  loadConfig,
  MagicString,
  presetWind3,
  resetUrl,
  transformerDirectives,
  transformerVariantGroup,
} from "../deps/unocss.ts";

import type Site from "../core/site.ts";
import type {
  SourceCodeTransformer,
  UnocssPluginContext,
  UnoGenerator,
  UserConfig,
} from "../deps/unocss.ts";

export interface Options {
  /**
   * Configurations for UnoCSS.
   * @see https://unocss.dev/guide/config-file
   * @default
   * {
   *  presets: [presetWind3()]
   * }
   */
  options?: UserConfig;

  /**
   * Set the css filename for all generated styles,
   * Set to `false` to insert a <style> tag per page.
   * @default "unocss.css"
   */
  cssFile?: false | string;

  /**
   * A placeholder to replace with the generated CSS.
   * Only used when `cssFile` is set.
   */
  placeholder?: string;

  /**
   * Process CSS files using UnoCSS transformers.
   * @default
   * [
   *  transformerVariantGroup(),
   *  transformerDirectives()
   * ]
   * @deprecated set `options.transformers` instead
   */
  transformers?: SourceCodeTransformer[];

  /**
   * Supported CSS reset options.
   * @see https://github.com/unocss/unocss/tree/main/packages/reset
   * @default false
   */
  reset?: false | "tailwind" | "tailwind-compat" | "eric-meyer";
}

export const defaults = {
  options: {
    presets: [presetWind3],
    transformers: [
      transformerVariantGroup(),
      transformerDirectives(),
    ],
  },
  reset: false,
} satisfies Options;

const INCLUDE_COMMENT = "@unocss-include";
const IGNORE_COMMENT = "@unocss-ignore";
const CSS_PLACEHOLDER = "@unocss-placeholder";
const SKIP_START_COMMENT = "@unocss-skip-start";
const SKIP_END_COMMENT = "@unocss-skip-end";
const SKIP_COMMENT_RE = new RegExp(
  `(\/\/\\s*?${SKIP_START_COMMENT}\\s*?|\\/\\*\\s*?${SKIP_START_COMMENT}\\s*?\\*\\/|<!--\\s*?${SKIP_START_COMMENT}\\s*?-->)[\\s\\S]*?(\/\/\\s*?${SKIP_END_COMMENT}\\s*?|\\/\\*\\s*?${SKIP_END_COMMENT}\\s*?\\*\\/|<!--\\s*?${SKIP_END_COMMENT}\\s*?-->)`,
  "g",
);

function createContext(
  currentDirectory: string = cwd(),
  config: UserConfig = {},
): UnocssPluginContext {
  let root = currentDirectory;
  let rawConfig = {} as UserConfig;
  let configFileList: string[] = [];
  let uno: UnoGenerator;
  const unoPromise = createGenerator(rawConfig).then((r) => {
    uno = r;
    return r;
  });

  const invalidations: Array<() => void> = [];
  const reloadListeners: Array<() => void> = [];

  const modules = new BetterMap<string, string>();
  const tokens = new Set<string>();
  const tasks: Promise<void>[] = [];
  const affectedModules = new Set<string>();

  let ready = reloadConfig();

  function invalidate() {
    invalidations.forEach((cb) => cb());
  }

  function dispatchReload() {
    reloadListeners.forEach((cb) => cb());
  }

  async function reloadConfig() {
    await unoPromise;
    const result = await loadConfig(root, config);
    rawConfig = result.config;
    configFileList = result.sources;
    await uno.setConfig(rawConfig);
    tokens.clear();
    await Promise.all(
      modules.map((code, id) =>
        uno.applyExtractors(code.replace(SKIP_COMMENT_RE, ""), id, tokens)
      ),
    );
    invalidate();
    dispatchReload();
    return result;
  }

  async function updateRoot(newRoot: string) {
    if (newRoot !== root) {
      root = newRoot;
      ready = reloadConfig();
    }
    return await ready;
  }

  async function extract(code: string, id?: string) {
    await unoPromise;
    if (id) modules.set(id, code);
    const len = tokens.size;
    await uno.applyExtractors(code.replace(SKIP_COMMENT_RE, ""), id, tokens);
    if (tokens.size > len) invalidate();
  }

  function filter(code: string) {
    if (code.includes(IGNORE_COMMENT)) return false;
    return code.includes(INCLUDE_COMMENT) || code.includes(CSS_PLACEHOLDER);
  }

  async function getConfig() {
    await ready;
    return rawConfig;
  }

  return {
    get ready() {
      return ready;
    },
    tokens,
    modules,
    affectedModules,
    tasks,
    flushTasks: () => Promise.all(tasks),
    invalidate,
    onInvalidate(fn) {
      invalidations.push(fn);
    },
    filter,
    reloadConfig,
    onReload(fn) {
      reloadListeners.push(fn);
    },
    get uno() {
      if (!uno) {
        throw new Error(
          "Run `await context.ready` before accessing `context.uno`",
        );
      }
      return uno;
    },
    extract,
    getConfig,
    get root() {
      return root;
    },
    updateRoot,
    getConfigFileList: () => configFileList,
    // We don't care about virtual-module, which is a Vite/Webpack feature
    getVMPRegexes: () =>
      new Promise((resolve) =>
        resolve({
          prefix: "",
          RESOLVED_ID_WITH_QUERY_RE: /(?!)/,
          RESOLVED_ID_RE: /(?!)/,
        })
      ),
  };
}

/**
 * A plugin to generate CSS using UnoCSS
 * @see https://lume.land/plugins/unocss/
 */
export function unoCSS(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    let uno: UnoGenerator;
    const unoCtx = createContext(site.options.cwd, options.options);
    async function getGenerator() {
      if (!uno) {
        uno = (await unoCtx.ready.then(() => unoCtx)).uno;
      }
      return uno;
    }

    const { cssFile = site.options.cssFile, reset } = options;
    const transformers = options.transformers ?? options.options.transformers;

    if (transformers.length > 0) {
      site.process([".css", ".html"], async function processUnoCSS(files) {
        await unoCtx.ready;
        for (const file of files) {
          const content = file.text;
          if (content) {
            const code = new MagicString(content);
            for await (const { transform } of transformers) {
              await transform(code, file.src.path, unoCtx);
            }
            file.content = code.toString();
          }
        }
      });
    }

    if (cssFile === false) {
      // Insert a <style> tag for each page
      site.process([".html"], async function processUnoCSSStyleTag(pages) {
        const resetCss = await getResetCss(reset);
        const uno = await getGenerator();

        await Promise.all(pages.map(async (page) => {
          const { document } = page;
          const result = await uno.generate(
            document.documentElement?.innerHTML ?? "",
          );
          const css = resetCss ? `${resetCss}\n${result.css}` : result.css;

          if (css) {
            const style = document.createElement("style");
            style.innerText = css;
            document.head.appendChild(style);
          }
        }));
      });
      return;
    }

    // Generate the stylesheets for all pages
    site.process([".html"], async function processUnoCSSContent(pages) {
      const classes = new Set<string>();
      const uno = await getGenerator();

      await Promise.all(
        pages.map(async (page) =>
          await uno.generate(
            page.document.documentElement?.innerHTML ?? "",
          )
            .then((res) => res.matched)
            .then((matched) => matched.forEach((match) => classes.add(match)))
        ),
      );

      // Create & merge stylesheets for all pages
      const resetCss = await getResetCss(reset);
      const result = await uno.generate(classes);
      const css = resetCss ? `${resetCss}\n${result.css}` : result.css;

      // Output the CSS file
      const output = await site.getOrCreatePage(cssFile);
      output.text = insertContent(output.text, css, options.placeholder);
    });
  };
}

/**
 * TODO: Replace with CSS Modules Import
 * @remarks Deno does not currently support CSS Modules.
 * @see https://github.com/denoland/deno/issues/11961
 */
async function getResetCss(reset: Options["reset"]) {
  return reset === false ? "" : await read(`${resetUrl}/${reset}.css`, false);
}

export default unoCSS;
