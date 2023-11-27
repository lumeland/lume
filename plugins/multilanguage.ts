import { merge } from "../core/utils/object.ts";
import { log } from "../core/utils/log.ts";

import type Site from "../core/site.ts";
import type { Data } from "../core/file.ts";

export interface Options {
  /** The list of extensions used for this plugin */
  extensions?: string[];

  /** Available languages */
  languages: string[];

  /** A prefix-free language */
  defaultLanguage?: string;
}

// Default options
export const defaults: Options = {
  extensions: [".html"],
  languages: [],
};

export default function multilanguage(userOptions: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    // Configure the merged keys
    options.languages.forEach((lang) => site.mergeKey(lang, "object"));

    // Preprocessor to setup multilanguage pages
    site.preprocess(options.extensions, (pages) => {
      pages.forEach((page) => {
        const lang = page.data.lang;

        // If the "lang" variable is not defined, use the default language
        if (lang === undefined) {
          page.data.lang = options.defaultLanguage;
          return;
        }

        // If the "lang" variable is a string, check if it's a valid language
        if (typeof lang === "string") {
          if (!options.languages.includes(lang)) {
            log.warning(
              `[multilanguage plugin] The language "${lang}" in the page ${page.sourcePath} is not defined in the "languages" option.`,
            );
          }
          return;
        }

        throw new Error(`Invalid "lang" variable in ${page.sourcePath}.`);
      });
    });

    // Preprocessor to assign the data of the page language
    site.preprocess(options.extensions, (pages) => {
      pages.forEach((page) => {
        const data = page.data;
        const { lang } = data;

        if (typeof lang !== "string") {
          return;
        }

        // Merge the language data with the page data
        for (const key of options.languages) {
          if (key in data) {
            if (key === lang) {
              Object.assign(data, data[key]);
            }
            delete data[key];
          }
        }
      });
    });

    // Preprocessor to (un)prefix all urls with the language code
    site.preprocess(options.extensions, (pages) => {
      pages.forEach((page) => {
        const { lang } = page.data;

        if (typeof lang !== "string") {
          return;
        }

        const url = page.data.url;

        if (!url.startsWith(`/${lang}/`) && lang !== options.defaultLanguage) {
          page.data.url = `/${lang}${url}`;
        } else if (
          url.startsWith(`/${lang}/`) && lang === options.defaultLanguage
        ) {
          page.data.url = url.slice(lang.length + 1);
        }
      });
    });

    // Preprocessor to build the alternates object
    site.preprocess(options.extensions, (pages, allPages) => {
      pages.forEach((page) => {
        const { data } = page;
        const id = data.id as string | undefined;

        if (data.alternates || !id) {
          return;
        }

        const alternates: Data[] = [];
        const alternatePages = allPages.filter((page) => page.data.id === id);

        options.languages.forEach((lang) => {
          const page = alternatePages.find((page) => page.data.lang === lang);

          if (page) {
            alternates.push(page.data);
            page.data.alternates = alternates;
          }
        });
      });
    });

    // Include automatically the <link rel="alternate"> elements
    // with the other languages
    site.process(options.extensions, (pages) => {
      for (const page of pages) {
        const { document } = page;
        const alternates = page.data.alternates;
        const lang = page.data.lang as string | undefined;

        if (!document || !alternates || !lang) {
          continue;
        }

        // Include <html lang="${lang}"> attribute element if it's missing
        if (!document.documentElement?.getAttribute("lang")) {
          document.documentElement?.setAttribute("lang", lang);
        }

        // Insert the <link> elements automatically
        for (const data of alternates) {
          const meta = document.createElement("link");
          meta.setAttribute("rel", "alternate");
          meta.setAttribute("hreflang", data.lang as string);
          meta.setAttribute("href", site.url(data.url, true));
          document.head.appendChild(meta);
          document.head.appendChild(document.createTextNode("\n"));
        }
      }
    });
  };
}

/** Extends PageData interface */
declare global {
  namespace Lume {
    export interface PageData {
      /** The id of the page (used to relate with other pages) */
      id: string;

      /**
       * Alternate pages (for languages)
       * @see https://lume.land/plugins/multilanguage/
       */
      alternates: PageData[];
    }
  }
}
