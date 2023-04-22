import { merge } from "../core/utils.ts";

import { Data, Page, Site } from "../core.ts";

export interface Options {
  /** The helper name */
  name: string;

  /** To return only the `page.data` value */
  returnPageData: boolean;
}

export const defaults: Options = {
  name: "search",
  returnPageData: false,
};

/** Register the plugin to enable the `search` helpers */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.data(options.name, new Search(site, options.returnPageData));
    site.filter("data", data);
  };
}

type Query = string | string[];
type Condition = [string, string, unknown];

/** Search helper */
export class Search {
  #site: Site;
  #cache = new Map<string, Page[]>();
  #returnPageData: boolean;

  constructor(site: Site, returnPageData: boolean) {
    this.#site = site;
    this.#returnPageData = returnPageData;

    site.addEventListener("beforeUpdate", () => this.#cache.clear());
  }

  /**
   * Return the data in the scope of a path (file or folder)
   * @deprecated Use `search.page()` instead
   */
  data(path = "/"): Data | undefined {
    const result = this.#site.pages.find((page) => page.data.url === path);

    if (result) {
      return result.data;
    }
  }

  /** Search pages */
  pages(query?: Query, sort?: Query, limit?: number) {
    const pages = this.#searchPages(query, sort);
    const result = this.#returnPageData ? data(pages) : pages;

    if (!limit) {
      return result;
    }

    return (limit < 0) ? result.slice(limit) : result.slice(0, limit);
  }

  /** Search and return a page */
  page(query?: Query, sort?: Query) {
    return this.pages(query, sort)[0];
  }

  /** Returns all values from the same key of a search */
  values(key: string, query?: Query) {
    const values = new Set();

    this.#searchPages(query).forEach((page) => {
      const value = page.data[key];

      if (Array.isArray(value)) {
        value.forEach((v) => values.add(v));
      } else if (value !== undefined) {
        values.add(value);
      }
    });

    return Array.from(values);
  }

  /** Returns all tags values of a search */
  tags(query?: Query) {
    return this.values("tags", query);
  }

  /** Return the next page of a search */
  nextPage(url: string, query?: Query, sort?: Query) {
    const pages = this.#searchPages(query, sort);
    const index = pages.findIndex((page) => page.data.url === url);

    return (index === -1)
      ? undefined
      : this.#returnPageData
      ? pages[index + 1].data
      : pages[index + 1];
  }

  /** Return the previous page of a search */
  previousPage(url: string, query?: Query, sort?: Query) {
    const pages = this.#searchPages(query, sort);
    const index = pages.findIndex((page) => page.data.url === url);

    return (index <= 0)
      ? undefined
      : this.#returnPageData
      ? pages[index - 1].data
      : pages[index - 1];
  }

  #searchPages(query?: Query, sort: Query = "date"): Page[] {
    if (Array.isArray(query)) {
      query = query.join(" ");
    }

    const id = JSON.stringify([query, sort]);

    if (this.#cache.has(id)) {
      return [...this.#cache.get(id)!];
    }

    const filter = buildFilter(query, this.#site.options.server.page404);
    const result = this.#site.pages.filter(filter);

    result.sort(buildSort(sort));

    this.#cache.set(id, result);
    return [...result];
  }
}

function data(pages: Page[]): Data[] {
  return pages.map((page) => page.data);
}

/**
 * Parse a query string and return a function to filter a search result
 *
 * example: "title=foo level<3"
 * returns: (page) => page.data.title === "foo" && page.data.level < 3
 */
export function buildFilter(query = "", page404 = ""): (page: Page) => boolean {
  // (?:(not)?(fieldName)(operator))?(value|"value"|'value')
  const matches = query
    ? query.matchAll(
      /(?:(!)?([\w.-]+)([!^$*]?=|[<>]=?))?([^'"\s][^\s=<>]*|"[^"]+"|'[^']+')/g,
    )
    : [];

  const conditions: Condition[] = [
    // Always return html pages
    ["outputPath", "$=", ".html"],

    // Exclude the 404 page
    ["data.url", "!=", page404],
  ];

  for (const match of matches) {
    let [, not, key, operator, value] = match;

    if (!key) {
      key = "tags";
      operator = "*=";

      if (value?.startsWith("!")) {
        not = not ? "" : "!";
        value = value.slice(1);
      }
    }

    if (not) {
      operator = "!" + operator;
    }

    conditions.push([`data.${key}`, operator, compileValue(value)]);
  }

  return compileFilter(conditions);
}

/**
 * Convert a parsed query to a function
 *
 * example: [["data.title", "=", "foo"], ["data.level", "<", 3]]
 * returns: (page) => page.data.title === "foo" && page.data.level < 3
 */
function compileFilter(conditions: Condition[]) {
  const filters: string[] = [];
  const args: string[] = [];
  const values: unknown[] = [];

  conditions.forEach((condition, index) => {
    const [key, operator, value] = condition;
    const varName = `value${index}`;

    filters.push(compileCondition(key, operator, varName, value));
    args.push(varName);
    values.push(value);
  });

  args.push(`return (page) => ${filters.join(" && ")};`);

  const factory = new Function(...args);

  return factory(...values);
}

/**
 * Convert a parsed condition to a function
 *
 * example: key = "title", operator = "=" name = "value0" value = "foo"
 * returns: page.data.title === value0
 */
function compileCondition(
  key: string,
  operator: string,
  name: string,
  value: unknown,
) {
  key = key.replaceAll(".", "?.");

  if (value instanceof Date) {
    switch (operator) {
      case "=":
        return `page.${key}?.getTime() === ${name}.getTime()`;

      case "!=":
        return `page.${key}?.getTime() !== ${name}.getTime()`;

      case "<":
      case "<=":
      case ">":
      case ">=":
        return `page.${key}?.getTime() ${operator} ${name}.getTime()`;

      case "!<":
      case "!<=":
      case "!>":
      case "!>=":
        return `!(page.${key}?.getTime() ${
          operator.substring(1)
        } ${name}.getTime())`;

      default:
        throw new Error(`Operator ${operator} not valid for Date values`);
    }
  }

  if (Array.isArray(value)) {
    switch (operator) {
      case "=":
        return `${name}.some((i) => page.${key} === i)`;

      case "!=":
        return `${name}.some((i) => page.${key} !== i)`;

      case "^=":
        return `${name}.some((i) => page.${key}?.startsWith(i))`;

      case "!^=":
        return `!${name}.some((i) => page.${key}?.startsWith(i))`;

      case "$=":
        return `${name}.some((i) => page.${key}?.endsWith(i))`;

      case "!$=":
        return `!${name}.some((i) => page.${key}?.endsWith(i))`;

      case "*=":
        return `${name}.some((i) => page.${key}?.includes(i))`;

      case "!*=":
        return `${name}.some((i) => page.${key}?.includes(i))`;

      case "!<":
      case "!<=":
      case "!>":
      case "!>=":
        return `!${name}.some((i) => page.${key} ${operator.substring(1)} i)`;

      default: // < <= > >=
        return `${name}.some((i) => page.${key} ${operator} i)`;
    }
  }

  switch (operator) {
    case "=":
      return `page.${key} === ${name}`;

    case "!=":
      return `page.${key} !== ${name}`;

    case "^=":
      return `page.${key}?.startsWith(${name})`;

    case "!^=":
      return `!page.${key}?.startsWith(${name})`;

    case "$=":
      return `page.${key}?.endsWith(${name})`;

    case "!$=":
      return `!page.${key}?.endsWith(${name})`;

    case "*=":
      return `page.${key}?.includes(${name})`;

    case "!*=":
      return `!page.${key}?.includes(${name})`;

    case "!<":
    case "!<=":
    case "!>":
    case "!>=":
      return `!(page.${key} ${operator.substring(1)} ${name})`;

    default: // < <= > >=
      return `page.${key} ${operator} ${name}`;
  }
}

/**
 * Compile a value and return the proper type
 *
 * example: "true" => true
 * example: "foo" => "foo"
 * example: "2021-06-12" => new Date(2021, 05, 12)
 */
function compileValue(value: string): unknown {
  if (!value) {
    return value;
  }

  // Remove quotes
  const quoted = !!value.match(/^('|")(.*)\1$/);

  if (quoted) {
    value = value.slice(1, -1);
  }

  if (value.includes("|")) {
    return value.split("|").map((val) => compileValue(val));
  }

  if (quoted) {
    return value;
  }

  if (value.toLowerCase() === "true") {
    return true;
  }
  if (value.toLowerCase() === "false") {
    return false;
  }
  if (value.toLowerCase() === "undefined") {
    return undefined;
  }
  if (value.toLowerCase() === "null") {
    return null;
  }
  if (value.match(/^\d+$/)) {
    return Number(value);
  }
  if (typeof value === "number" && isFinite(value)) {
    return Number(value);
  }
  // Date or datetime values:
  // yyyy-mm
  // yyyy-mm-dd
  // yyyy-mm-ddThh
  // yyyy-mm-ddThh:ii
  // yyyy-mm-ddThh:ii:ss
  const match = value.match(
    /^(\d{4})-(\d\d)(?:-(\d\d))?(?:T(\d\d)(?::(\d\d))?(?::(\d\d))?)?$/i,
  );

  if (match) {
    const [, year, month, day, hour, minute, second] = match;

    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      day ? parseInt(day) : 1,
      hour ? parseInt(hour) : 0,
      minute ? parseInt(minute) : 0,
      second ? parseInt(second) : 0,
    );
  }

  return value;
}

/**
 * Convert a query to sort to a function
 *
 * example: "title=desc"
 * returns: (a, b) => a.data.title > b.data.title
 */
export function buildSort(sort: Query): (a: Page, b: Page) => number {
  let fn = "0";

  if (typeof sort === "string") {
    sort = sort.split(/\s+/).filter((arg) => arg);
  }

  sort.reverse().forEach((arg) => {
    const match = arg.match(/([\w.-]+)(?:=(asc|desc))?/);

    if (!match) {
      return;
    }

    let [, key, direction] = match;
    key = key.replaceAll(".", "?.");
    const operator = direction === "desc" ? ">" : "<";
    fn =
      `(a.data?.${key} == b.data?.${key} ? ${fn} : (a.data?.${key} ${operator} b.data?.${key} ? -1 : 1))`;
  });

  return new Function("a", "b", `return ${fn}`) as (a: Page, b: Page) => number;
}
