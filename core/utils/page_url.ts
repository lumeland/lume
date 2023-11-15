import { posix } from "../../deps/path.ts";

import type { Page, RawData } from "../file.ts";

/** Returns the final URL assigned to a page */
export function getPageUrl(
  page: Page,
  prettyUrls: boolean,
  parentPath: string,
): string | false {
  const data = page.data as RawData;
  let { url } = data;

  if (url === false) {
    return false;
  }

  if (typeof url === "function") {
    url = url(page, getDefaultUrl(page, parentPath, prettyUrls));
  }

  if (url === false) {
    return false;
  }

  if (typeof url === "string") {
    // Relative URL
    if (url.startsWith("./") || url.startsWith("../")) {
      return normalizeUrl(posix.join(parentPath, url));
    }

    if (url.startsWith("/")) {
      return normalizeUrl(url);
    }

    throw new Error(
      `The url variable for the page ${page.sourcePath} (${url}) must start with "/", "./" or "../" `,
    );
  }

  // If the user has provided a value which hasn't yielded a string then it is an invalid url.
  if (url !== undefined) {
    throw new Error(
      `The url variable for the page ${page.sourcePath} is not correct. If specified, it should either be a string, or a function which returns a string. The provided url is of type: ${typeof url}.`,
    );
  }

  return getDefaultUrl(page, parentPath, prettyUrls);
}

/** Returns the default URL for a page */
function getDefaultUrl(
  page: Page,
  parentPath: string,
  prettyUrls: boolean,
): string {
  // Calculate the URL from the path
  const url = posix.join(parentPath, page.data.slug);

  if (page.src.asset) {
    return url + page.src.ext;
  }

  // Pretty URLs affects to all pages but 404
  if (prettyUrls && url !== "/404") {
    if (posix.basename(url) === "index") {
      return posix.join(posix.dirname(url), "/");
    }
    return posix.join(url, "/");
  }

  return `${url}.html`;
}

/** Remove the /index.html part if exist and replace spaces */
function normalizeUrl(url: string): string {
  url = encodeURI(url);

  if (url.endsWith("/index.html")) {
    return url.slice(0, -10);
  }

  return url;
}
