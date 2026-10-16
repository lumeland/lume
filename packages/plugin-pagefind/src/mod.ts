import { merge } from "@lumeland/core/utils/object.ts";
import { insertContent } from "@lumeland/core/utils/page_content.ts";
import { read } from "@lumeland/core/utils/read.ts";
import { Page } from "@lumeland/core/file.ts";
import { log } from "@lumeland/core/utils/log.ts";
import { posix } from "../deps/path.ts";
import { pagefind as Pagefind, getAssets } from "../deps/pagefind.ts";

import type Site from "@lumeland/core/site.ts";
import type { CustomRecord } from "../deps/pagefind.ts";

export interface Options {
  /** The path to the pagefind bundle directory */
  outputPath?: string;

  /** Include the new Component UI files */
  componentUI:
    | {
        /** The CSS file to output the components styles */
        cssFile?: string;

        /** The CSS file to output the components JavaScript code */
        jsFile?: string;

        /** A placeholder to replace with the generated CSS and Js */
        placeholder?: string;
      }
    | false;

  /** Options for the indexing process */
  indexing?: Pagefind.PagefindServiceConfig;

  /** Other custom records */
  customRecords?: CustomRecord[];
}

export const defaults = {
  outputPath: "/pagefind",
  componentUI: {},
  indexing: {
    rootSelector: "html",
    verbose: false,
    excludeSelectors: [],
  },
} satisfies Options;

/**
 * A plugin to generate a static full text search engine
 * @see https://lume.land/plugins/pagefind/
 */
export function pagefind(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    // Add Component UI files if enabled
    if (options.componentUI) {
      const assets = getAssets();
      const cssFile = posix.join("/", options.componentUI.cssFile || site.options.cssFile);
      const jsFile = posix.join("/", options.componentUI.jsFile || site.options.jsFile);
      const placeholder = options.componentUI.placeholder;

      site.process(async () => {
        const cssPage = await site.getOrCreatePage(cssFile);
        cssPage.text = insertContent(cssPage.text, await read(assets.css), placeholder);

        const jsPage = await site.getOrCreatePage(jsFile);
        jsPage.text = insertContent(jsPage.text, await read(assets.js), placeholder);
      });
    }

    site.process([".html"], async function processPagefind(pages, allPages) {
      const { index } = await Pagefind.createIndex(options.indexing);

      if (!index) {
        throw new Error("Pagefind index not created");
      }

      // Page indexing
      for (const page of pages) {
        const { errors } = await index.addHTMLFile({
          url: page.data.url,
          content: page.content as string,
        });

        if (errors.length > 0) {
          log.error(`[pagefind plugin] Indexing errors for ${page.src.path}`, errors);
          continue;
        }
      }

      if (options.customRecords) {
        for (const record of options.customRecords) {
          const { errors } = await index.addCustomRecord(record);

          if (errors.length > 0) {
            log.error(`[pagefind plugin] Pagefind index errors for custom record`, errors);
            continue;
          }
        }
      }

      // Output indexing
      const { files } = await index.getFiles();
      const textDecoder = new TextDecoder();
      const textExtensions = [".js", ".css", ".json"];

      for (const file of files) {
        const { path } = file;
        if (path.endsWith(".css") || path.endsWith(".js")) {
          continue; // Don't export UI files
        }
        const content = textExtensions.includes(posix.extname(path))
          ? textDecoder.decode(file.content)
          : file.content;

        allPages.push(
          Page.create({
            url: posix.join("/", options.outputPath, path),
            content,
          }),
        );
      }

      // Cleanup
      await index.deleteIndex();
      await Pagefind.close();
    });
  };
}

export default pagefind;
