import type { Data } from "../file.ts";

/**
 * Get the value of a page data
 * For example, if the value is "=title", it returns the value of the page data "title"
 * If the value is "$.title", it will return the value of the element with the selector ".title"
 */
export function getDataValue(data: Partial<Data>, value?: unknown) {
  // Get the value from the page data
  if (typeof value === "string") {
    if (value.startsWith("=")) {
      const key = value.slice(1);

      if (!key.includes(".")) {
        return data[key];
      }

      const keys = key.split(".");
      let val = data;
      for (const key of keys) {
        val = val?.[key];
      }
      return val;
    }

    if (value.startsWith("$")) {
      return queryCss(value, data.page?.document);
    }
  }

  if (typeof value === "function") {
    return value(data);
  }

  return value;
}

function queryCss(value: string, document?: Document) {
  // https://regexr.com/7qnot
  const checkForAttrPattern = /^\$(.+)\s+(?:attr\(([\w\-]+)\))$/;
  const checkResult = value.match(checkForAttrPattern);

  const hasAttr = checkResult?.[0];
  if (hasAttr) {
    const [_, query, name] = checkResult;
    return document?.querySelector(query)?.getAttribute(name);
  }

  const query = value.slice(1);
  return document?.querySelector(query)?.innerHTML;
}
