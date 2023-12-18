import { Page } from "../core/file.ts";
import { assign, merge } from "../core/utils/object.ts";
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
    site.preprocess(options.extensions, (pages, allPages) => {
      for (const page of pages) {
        const { data } = page;
        const languages = data.lang as string | string[] | undefined;

        // If the "lang" variable is not defined, use the default language
        if (languages === undefined) {
          data.lang = options.defaultLanguage;
          continue;
        }

        // If the "lang" variable is a string, check if it's a valid language
        if (typeof languages === "string") {
          if (!options.languages.includes(languages)) {
            log.warning(
              `[multilanguage plugin] The language "${languages}" in the page ${page.sourcePath} is not defined in the "languages" option.`,
            );
          }
          continue;
        }

        // The "lang" variable of the pages must be an array
        if (!Array.isArray(languages)) {
          throw new Error(`Invalid "lang" variable in ${page.sourcePath}`);
        }

        // Check if it's a valid language
        if (languages.some((lang) => !options.languages.includes(lang))) {
          log.warning(
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

    // Preprocessor to process the multilanguage data
    site.preprocess(options.extensions, (pages, allPages) => {
      for (const page of pages) {
        const data = page.data;
        const lang = data.lang!;

        // Resolve the language data
        for (const key of options.languages) {
          if (key in data) {
            if (key === lang) {
              assign(data, data[key]);
            }
            delete data[key];
          }
        }

        // Preprocessor to (un)prefix all urls with the language code
        const { url } = data;
        if (!url.startsWith(`/${lang}/`) && lang !== options.defaultLanguage) {
          data.url = `/${lang}${url}`;
        } else if (
          data.url.startsWith(`/${lang}/`) && lang === options.defaultLanguage
        ) {
          data.url = url.slice(lang.length + 1);
        }

        // Create the alternates object if it doesn't exist
        const { id, type } = data;
        if (data.alternates || id === undefined) {
          data.alternates ??= [data];
          continue;
        }

        const alternates: Data[] = [];
        const ids = new Map<string, Page>();

        allPages.filter((page) => page.data.id == id && page.data.type === type)
          .forEach((page) => {
            const id = `${page.data.lang}-${page.data.id}-${page.data.type}`;
            const existing = ids.get(id);
            if (existing) {
              log.warning(
                `[multilanguage] The pages ${existing.sourcePath} and ${page.sourcePath} have the same id, type and language.`,
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
