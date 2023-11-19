import { Page } from "../core/file.ts";
import { isPlainObject, merge } from "../core/utils/object.ts";
import { log } from "../core/utils/log.ts";
import { getPageUrl } from "../core/utils/page_url.ts";
import { posix } from "../deps/path.ts";

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
    site.preprocess(options.extensions, (pages, allPages) => {
      pages.forEach((page) => {
        const { data } = page;
        const languages = data.lang as string | string[] | undefined;

        // If the "lang" variable is not defined, use the default language
        if (languages === undefined) {
          data.lang = options.defaultLanguage;
          return;
        }

        // If the "lang" variable is a string, check if it's a valid language
        if (typeof languages === "string") {
          if (!options.languages.includes(languages)) {
            log.warning(
              `[multilanguage plugin] The language "${languages}" in the page ${page.sourcePath} is not defined in the "languages" option.`,
            );
          }
          return;
        }

        // The "lang" variable of the pages must be an array
        if (!Array.isArray(languages)) {
          return;
        }

        // Create a new page per language
        const newPages: Page[] = [];
        const id: string = data.id || page.src.path.slice(1);
        const basePath: string = typeof page.data.url === "string"
          ? posix.dirname(page.data.url)
          : "";

        for (const lang of languages) {
          const newData: Data = { ...data, lang, id };
          const newPage = page.duplicate(undefined, newData);
          newPages.push(newPage);

          // Fix the url
          const customUrl = (newData[`url.${lang}`] || newData[lang]?.url) as
            | string
            | undefined;

          if (customUrl) {
            newData.url = customUrl;
            const url = getPageUrl(newPage, site.options.prettyUrls, basePath);
            if (!url) {
              log.warning(
                `[multilanguage plugin] The page ${page.sourcePath} has a custom url "${customUrl}" that is not valid.`,
              );
            } else {
              newData.url = url;
            }
          } else if (newData.url) {
            newData.url = `/${lang}${newData.url}`;
          }
        }
        // Replace the current page with the multiple language versions
        allPages.splice(allPages.indexOf(page), 1, ...newPages);
      });
    });

    // Preprocessor to process the multilanguage data
    site.preprocess(options.extensions, (pages) => {
      pages.forEach((page) => {
        const lang = page.data.lang;

        if (typeof lang !== "string") {
          return;
        }

        const data = filterLanguage(
          options.languages,
          lang,
          page.data,
        ) as Data;

        for (const key of options.languages) {
          if (key in data) {
            if (key === lang) {
              Object.assign(data, data[key]);
            }
            delete data[key];
          }
        }

        page.data = data;
      });
    });

    // Preprocessor to (un)prefix all urls with the language code
    site.preprocess(options.extensions, (pages) => {
      pages.forEach((page) => {
        const { lang } = page.data;

        if (typeof lang !== "string") {
          return;
        }

        const url = page.data.url as string | undefined;

        if (!url) {
          return;
        }

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
        const id = data.id as string | number | undefined;

        if (data.alternates || !id) {
          return;
        }

        const alternates: Data[] = [];
        const alternatePages = allPages.filter((page) => page.data.id == id);

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
    site.process(options.extensions, (pages) =>
      pages.forEach((page) => {
        const { document } = page;
        const alternates = page.data.alternates;
        const lang = page.data.lang as string | undefined;

        if (!document || !alternates || !lang) {
          return;
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
          meta.setAttribute("href", site.url(data.url as string, true));
          document.head.appendChild(meta);
          document.head.appendChild(document.createTextNode("\n"));
        }
      }));
  };
}

/**
 * Remove the entries from all "langs" except the "lang" value
 */
function filterLanguage(
  langs: string[],
  lang: string,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [name, value] of Object.entries(data)) {
    const parts = name.match(/^(.*)\.([^.]+)$/);

    if (parts) {
      const [, key, l] = parts;

      if (lang === l) {
        result[key] = value;
        continue;
      } else if (langs.includes(l)) {
        continue;
      }
    }

    if (name in result) {
      continue;
    }

    if (isPlainObject(value)) {
      result[name] = filterLanguage(langs, lang, value);
    } else if (Array.isArray(value)) {
      result[name] = value.map((item) => {
        return isPlainObject(item) ? filterLanguage(langs, lang, item) : item;
      });
    } else {
      result[name] = value;
    }
  }

  return result;
}

/** Extends PageData interface */
declare global {
  namespace Lume {
    export interface PageData {
      /**
       * Alternate pages (for languages)
       * @see https://lume.land/plugins/multilanguage/
       */
      alternates: PageData[];
    }
  }
}
