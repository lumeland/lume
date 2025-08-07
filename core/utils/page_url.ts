import { posix } from "../../deps/path.ts";
import { getExtension, normalizePath } from "./path.ts";

import type { Destination } from "../source.ts";
import type { Data, Page, RawData } from "../file.ts";

/** Returns a function to filter the 404 page */
export function filter404page(page404?: string): (page: Data) => boolean {
  const url404 = page404 ? normalizePath(page404) : undefined;

  return url404 ? (data: Data) => data.url !== url404 : () => true;
}

/** Returns the final part of a url */
export function getBasename(url: string): string {
  if (url === "/") {
    return "";
  }

  if (url.endsWith("/")) {
    return decodeURI(posix.basename(url));
  }

  return decodeURI(posix.basename(url, getExtension(url)));
}

/** Returns the final URL assigned to a page */
export function getPageUrl(
  page: Page,
  prettyUrls: boolean,
  parentPath: string,
  destination?: Destination | string,
): string | false {
  const data = page.data as RawData;
  let { url } = data;

  if (url === false) {
    return false;
  }

  if (typeof url === "function") {
    page.data.url = getDefaultUrl(page.data.basename, parentPath, prettyUrls);
    url = url(page);
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

  if (typeof destination === "string") {
    return normalizeUrl(destination);
  }

  const defaultUrl = getDefaultUrl(
    String(page.data.basename),
    parentPath,
    prettyUrls,
  );
  return destination ? destination(defaultUrl) : defaultUrl;
}

/** Returns the default URL for a page */
function getDefaultUrl(
  basename: string,
  parentPath: string,
  prettyUrls: boolean,
): string {
  // Calculate the URL from the path
  const url = posix.join(parentPath, basename);

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
