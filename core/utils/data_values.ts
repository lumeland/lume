import { plainText } from "../../deps/remove-markdown.ts";

import type { Data } from "../file.ts";

/**
 * Get the value of a page data
 * For example, if the value is "=title", it returns the value of the page data "title"
 * If the value is "$.title", it will return the value of the element with the selector ".title"
 */
export function getDataValue(data: Partial<Data>, value?: unknown) {
  // Get the value from the page data
  if (typeof value === "string") {
    return searchValue(data, value);
  }

  if (typeof value === "function") {
    return value(data);
  }

  return value;
}

export function getPlainDataValue(data: Partial<Data>, value?: unknown) {
  const val = getDataValue(data, value);

  if (typeof val === "string") {
    return plainText(val);
  }

  return val;
}

function searchValue(data: Partial<Data>, value: string): unknown {
  if (!value) {
    return;
  }

  if (value.startsWith("=")) {
    let key = value.slice(1);
    [key, value] = parseFallback(key);

    if (!key.includes(".")) {
      return data[key] ?? searchValue(data, value);
    }

    const keys = key.split(".");
    // deno-lint-ignore no-explicit-any
    let val: any = data;
    for (const key of keys) {
      val = val?.[key];
    }
    if (typeof val === "string" && val.startsWith("=")) {
      return searchValue(data, val);
    }
    return val ?? searchValue(data, value);
  }

  if (value.startsWith("$")) {
    let selector = value.slice(1);
    [selector, value] = parseFallback(selector);

    return queryCss(selector, data.page?.document) ?? searchValue(data, value);
  }

  return value;
}

function parseFallback(key: string): [string, string] {
  const fallback = key.indexOf("||");

  if (fallback !== -1) {
    return [
      key.slice(0, fallback).trim(),
      key.slice(fallback + 2).trim(),
    ];
  }

  return [
    key,
    "",
  ];
}

// https://regexr.com/7qnot
const checkForAttrPattern = /^(.+)\s+(?:attr\(([\w\-]+)\))$/;

function queryCss(query: string, document?: Document) {
  const checkResult = query.match(checkForAttrPattern);

  const hasAttr = checkResult?.[0];
  if (hasAttr) {
    const [_, query, name] = checkResult;
    return document?.querySelector(query)?.getAttribute(name);
  }

  return document?.querySelector(query)?.innerHTML;
}
