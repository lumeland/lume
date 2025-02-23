import { Page } from "../core/file.ts";
import { merge } from "../core/utils/object.ts";
import { overrideData } from "../core/utils/merge_data.ts";
import { log } from "../core/utils/log.ts";
import { filter404page } from "../core/utils/page_url.ts";

import type Site from "../core/site.ts";
import type { Data } from "../core/file.ts";

export interface Options {
  /** Available languages */
  languages: string[];

  /** A prefix-free language */
  defaultLanguage?: string;
}

// Default options
export const defaults: Options = {
  languages: [],
};

/**
 * A plugin to create multilanguage websites
 * @see https://lume.land/plugins/multilanguage/
 */
export function multilanguage(userOptions: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const isNot404page = filter404page(site.options.server.page404);

    // Configure the merged keys
    options.languages.forEach((lang) => site.mergeKey(lang, "data"));

    /**
     * Preprocessor to setup multilanguage pages
     *
     * + prevent incorrect data type of "page.data.lang"
     * + display guidance (warning log) to some bug-potential cases
     * + convert "page.data.lang" array type page (if yes) to string type page
     */
    site.preprocess([".html"], (filteredPages, allPages) => {
      for (const page of filteredPages) {
        const { data } = page;
        const languages = data.lang as string | string[] | undefined;

        // If the "lang" variable is not defined, use the default language
        if (languages === undefined) {
          data.lang = options.defaultLanguage;
          continue;
        }

        // 404 pages should not be multilanguage
        if (!isNot404page(data)) {
          if (Array.isArray(languages)) {
            data.lang = options.defaultLanguage;
          }
          continue;
        }

        // If the "lang" variable is a string, check if it's a valid language
        if (typeof languages === "string") {
          if (!options.languages.includes(languages)) {
            log.warn(
              `[multilanguage plugin] The language "${languages}" in the page ${page.sourcePath} is not defined in the "languages" option.`,
            );
          }
          continue;
        }

        // The "lang" variable of the pages must be an array
        if (!Array.isArray(languages)) {
          throw new Error(`Invalid "lang" variable in ${page.sourcePath}`);
        }

        // Check if these "languages" are all valid language codes
        if (languages.some((lang) => !options.languages.includes(lang))) {
          log.warn(
            `[multilanguage plugin] One or more languages in the page ${page.sourcePath} are not defined in the "languages" option.`,
          );
          continue;
        }

        // Create a new page per language
        const newPages: Page[] = [];
        const id = data.id ?? page.src.path.slice(1);

        for (const lang of languages) {
          const newData: Data = { ...data, lang, id };
          const newPage = page.duplicate(undefined, newData);
          newPages.push(newPage);
        }

        // Replace the current page with the multiple language versions
        allPages.splice(allPages.indexOf(page), 1, ...newPages);
      }
    });

    /**
     * Preprocessor to process the multilanguage data
     *
     * + convert plain url to language url
     * + create the alternates
     * + sort the alternates
     */
    site.preprocess([".html"], (pages) => {
      for (const page of pages) {
        const { data } = page;
        const { lang } = data;

        if (!lang) {
          continue;
        }

        // Get the language data
        const override = data[lang];

        // Remove all language data from the page data
        for (const key of options.languages) {
          delete data[key];
        }

        // Merge the language data with the page data
        if (override) {
          overrideData(data, override);
        }

        if (isNot404page(data)) {
          const { url } = data;
          const isLangUrl = url.startsWith(`/${lang}/`);
          const isDefaultLang = lang === options.defaultLanguage;
          if (!isLangUrl && !isDefaultLang) {
            // Preprocess to prefix all urls with the language code
            data.url = `/${lang}${url}`;
          } else if (isLangUrl && isDefaultLang) {
            // Preprocess to unprefix all urls with the default language code
            data.url = url.slice(lang.length + 1);
          }
        }

        // Create the alternates object if it doesn't exist
        const { id, type } = data;
        if (data.alternates || id === undefined) {
          data.alternates ??= [data];
          continue;
        }

        const alternates: Data[] = [];
        const ids = new Map<string, Page>();

        pages.filter((page) => page.data.id == id && page.data.type === type)
          .forEach((page) => {
            const id = `${page.data.lang}-${page.data.id}-${page.data.type}`;
            const existing = ids.get(id);
            if (existing) {
              log.warn(
                `[multilanguage plugin] The pages ${existing.sourcePath} and ${page.sourcePath} have the same id, type and language.`,
              );
            }
            ids.set(id, page);
            alternates.push(page.data);
            page.data.alternates = alternates;
          });

        // Sort the alternates by language
        alternates.sort((a, b) =>
          options.languages.indexOf(a.lang!) -
          options.languages.indexOf(b.lang!)
        );
      }
    });

    /**
     * Preprocessor to process the Unmatched Language URL
     *
     * + convert unmatchedLangUrl any value to URL string value
     */
    site.preprocess([".html"], (pages) => {
      for (const page of pages) {
        page.data.unmatchedLangUrl = getUnmatchedLangPath(
          page,
          pages,
        );
      }
    });

    // Include automatically the <link rel="alternate"> elements
    // with the other languages
    site.process([".html"], (pages) => {
      for (const page of pages) {
        const { document } = page;
        const alternates = page.data.alternates;
        const lang = page.data.lang as string | undefined;

        if (!alternates || !lang) {
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

        if (page.data.unmatchedLangUrl) {
          appendHreflang(
            "x-default",
            site.url(page.data.unmatchedLangUrl, true),
            document,
          );
        }
      }
    });
  };
}

function getUnmatchedLangPath(
  currentPage: Page<Data>,
  filteredPages: Page<Data>[],
): string | undefined {
  const { sourcePath } = currentPage;
  const { unmatchedLangUrl, alternates } = currentPage.data;

  if (!unmatchedLangUrl) return void 0;

  // If unmatchedLang is an external URL string
  if (URL.canParse(unmatchedLangUrl)) {
    return unmatchedLangUrl;
  }

  // If unmatchedLang is an source path string
  if (unmatchedLangUrl.startsWith("/")) {
    const langSelectorPage = filteredPages.some(
      (page) => page.data.url === unmatchedLangUrl,
    );

    if (!langSelectorPage) {
      log.warn(
        `[multilanguage plugin] The URL <cyan>${unmatchedLangUrl}</cyan> of unmatchedLangUrl option is not found in ${sourcePath}.`,
      );
    }
    return langSelectorPage ? unmatchedLangUrl : void 0;
  }

  // If unmatchedLang is language code → resolve to URL of that language
  const lang = alternates?.find((data) => data.lang === unmatchedLangUrl);
  if (!lang) {
    log.warn(
      `[multilanguage plugin] The URL for lang code "${unmatchedLangUrl}" of unmatchedLangUrl option is not found in ${sourcePath}.`,
    );
  }
  return lang?.url;
}

function appendHreflang(lang: string, url: string, document: Document) {
  const meta = document.createElement("link");
  meta.setAttribute("rel", "alternate");
  meta.setAttribute("hreflang", lang);
  meta.setAttribute("href", url);
  document.head.appendChild(meta);
  document.head.appendChild(document.createTextNode("\n"));
}

export default multilanguage;
