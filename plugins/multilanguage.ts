import { Page } from "../core/filesystem.ts";
import { isPlainObject, merge } from "../core/utils.ts";

import type { Data, Plugin } from "../core.ts";

export interface Options {
  /** The list of extensions used for this plugin */
  extensions: string[];

  /** The helper name */
  name: string;
}

// Default options
export const defaults: Options = {
  extensions: [".html"],
  name: "mergeLanguages",
};

type Alternates = Record<string, Page>;

export default function multilanguage(userOptions?: Partial<Options>): Plugin {
  const options = merge(defaults, userOptions);

  return (site) => {
    // Register the helper
    site.data(options.name, mergeLanguages);

    // Preprocessor to create new pages dynamically for each language
    site.preprocess(options.extensions, (page, pages) => {
      // The "lang" variable of the pages must be an array
      const languages = page.data.lang as string | string[] | undefined;

      if (!Array.isArray(languages)) {
        return;
      }

      // Create a Data for each language
      const languageData: Record<string, { data: Data; customUrl: boolean }> =
        {};
      languages.forEach((key) => {
        // deno-lint-ignore no-explicit-any
        const data: Record<string, any> = { ...page.data };

        // This language has a custom url (like url.en = "/english-url/")
        const customUrl = data[`url.${key}`] || data[key]?.url;

        // Remove all entries of other languages
        for (const [name, value] of Object.entries(data)) {
          if (languages.includes(name)) {
            if (name === key) {
              Object.assign(data, value);
            } else {
              delete data[name];
            }
          }
        }
        languageData[key] = {
          data: filterLanguage(languages, key, data),
          customUrl,
        };
      });

      const alternates: Alternates = {};

      // Create a new page per language
      const newPages: Page[] = [];

      for (const [l, { data, customUrl }] of Object.entries(languageData)) {
        data.alternates = alternates;
        data.lang = l;

        const newPage = page.duplicate(l);
        newPage.data = data;

        if (customUrl) {
          newPage.data.url = site.pagePreparer.getUrl(
            newPage,
            page.data.url as string,
          );
        } else {
          newPage.data.url = `/${l}${newPage.data.url}`;
        }

        alternates[l] = newPage;
        newPages.push(newPage);
      }

      // Replace the current page with the multiple languages
      pages.splice(pages.indexOf(page), 1, ...newPages);
    });

    // Include automatically the <link rel="alternate"> elements
    // with the other languages
    site.process(options.extensions, (page) => {
      const { document } = page;
      const alternates = page.data.alternates as
        | Alternates
        | undefined;
      const lang = page.data.lang as string | undefined;

      if (!document || !alternates || !lang) {
        return;
      }

      // Include <html lang="${lang}"> attribute element if it's missing
      if (!document.documentElement?.getAttribute("lang")) {
        document.documentElement?.setAttribute("lang", lang);
      }

      // Insert the <link> elements automatically
      for (const [altLang, altPage] of Object.entries(alternates)) {
        if (altLang === lang) {
          continue;
        }
        const meta = document.createElement("link");
        meta.setAttribute("rel", "alternate");
        meta.setAttribute("hreflang", altLang);
        meta.setAttribute("href", altPage.data.url);
        document.head.appendChild(meta);
        document.head.appendChild(document.createTextNode("\n"));
      }
    });
  };
}

/**
 * Manage multiple paginations from different languages.
 * Example:
 * ```ts
 * const pagination = paginateLanguages({
 *   en: paginate(englishPages),
 *   gl: paginate(galicianPages),
 * })
 * ```
 */
function mergeLanguages(
  pages: Record<string, Record<string, unknown>[]>,
): unknown[] {
  const result: unknown[] = [];
  const limit = Math.max(...Object.values(pages).map((v) => v.length));
  let index = 0;

  while (index < limit) {
    const page: Record<string, unknown> = {};

    for (const [lang, pageResults] of Object.entries(pages)) {
      const pageResult = pageResults[index];

      if (pageResult) {
        for (const [key, value] of Object.entries(pageResult)) {
          page[`${key}.${lang}`] = value;
        }
      }
    }
    result.push(page);
    index++;
  }

  return result;
}

/**
 * Remove the entries from all "langs" except the "lang" value
 */
function filterLanguage(langs: string[], lang: string, data: Data): Data {
  for (let [name, value] of Object.entries(data)) {
    if (isPlainObject(value)) {
      data[name] = value = filterLanguage(langs, lang, {
        ...value as Record<string, unknown>,
      });
    } else if (Array.isArray(value)) {
      data[name] = value = value.map((item) => {
        return isPlainObject(item)
          ? filterLanguage(langs, lang, { ...item as Record<string, unknown> })
          : item;
      });
    }

    const parts = name.match(/^(.*)\.([^.]+)$/);

    if (parts) {
      const [, key, l] = parts;

      if (langs.includes(l)) {
        if (lang === l) {
          data[key] = value;
        }

        delete data[name];
      }
    }
  }

  return data;
}
