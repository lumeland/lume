import { normalizePath } from "./utils.ts";
import { Data, Page } from "../core.ts";

export interface Options {
  /** The pages array */
  pages: Page[];

  /** Context data */
  sourceData: Map<string, Data>;

  filters?: Filter[];
}

type Filter = (data: Data) => boolean;
type Condition = [string, string, unknown];

/** Search helper */
export default class Searcher {
  #pages: Page[];
  #sourceData: Map<string, Data>;
  #cache = new Map<string, Data[]>();
  #filters: Filter[];

  constructor(options: Options) {
    this.#pages = options.pages;
    this.#sourceData = options.sourceData;
    this.#filters = options.filters || [];
  }

  /** Clear the cache (used after a change in watch mode) */
  deleteCache() {
    this.#cache.clear();
  }

  /**
   * Return the data in the scope of a path (file or folder)
   */
  data(path = "/"): Data | undefined {
    const normalized = normalizePath(path);
    const dirData = this.#sourceData.get(normalized);

    if (dirData) {
      return dirData;
    }

    const result = this.#pages.find((page) => page.data.url === normalized);

    if (result) {
      return result.data;
    }
  }

  /** Search pages */
  pages(query?: string, sort?: string, limit?: number): Data[] {
    const result = this.#searchPages(query, sort);

    if (!limit) {
      return result;
    }

    return (limit < 0) ? result.slice(limit) : result.slice(0, limit);
  }

  /** Returns all values from the same key of a search */
  values<T = unknown>(key: string, query?: string): T[] {
    const values = new Set();

    this.#searchPages(query).forEach((data) => {
      const value = data[key];

      if (Array.isArray(value)) {
        value.forEach((v) => values.add(v));
      } else if (value !== undefined) {
        values.add(value);
      }
    });

    return Array.from(values) as T[];
  }

  /** Return the next page of a search */
  nextPage(url: string, query?: string, sort?: string): Data | undefined {
    const pages = this.#searchPages(query, sort);
    const index = pages.findIndex((data) => data.url === url);

    return (index === -1) ? undefined : pages[index + 1];
  }

  /** Return the previous page of a search */
  previousPage(url: string, query?: string, sort?: string): Data | undefined {
    const pages = this.#searchPages(query, sort);
    const index = pages.findIndex((data) => data.url === url);

    return (index <= 0) ? undefined : pages[index - 1];
  }

  #searchPages(query?: string, sort = "date"): Data[] {
    const id = JSON.stringify([query, sort]);

    if (this.#cache.has(id)) {
      return [...this.#cache.get(id)!];
    }

    const compiledFilter = buildFilter(query);
    const filters = compiledFilter
      ? this.#filters.concat([compiledFilter])
      : this.#filters;
    const result = filters.reduce(
      (pages, filter) => pages.filter(filter),
      this.#pages.map((page) => page.data),
    );

    result.sort(buildSort(sort));
    this.#cache.set(id, result);
    return [...result];
  }
}

/**
 * Parse a query string and return a function to filter a search result
 *
 * example: "title=foo level<3"
 * returns: (page) => page.data.title === "foo" && page.data.level < 3
 */
export function buildFilter(query = ""): Filter | undefined {
  // (?:(not)?(fieldName)(operator))?(value|"value"|'value')
  const matches = query
    ? query.matchAll(
      /(?:(!)?([\w.-]+)([!^$*]?=|[<>]=?))?([^'"\s][^\s=<>]*|"[^"]+"|'[^']+')/g,
    )
    : [];

  const conditions: Condition[] = [];

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

    conditions.push([key, operator, compileValue(value)]);
  }

  if (conditions.length) {
    return compileFilter(conditions);
  }
}

/**
 * Convert a parsed query to a function
 *
 * example: [["title", "=", "foo"], ["level", "<", 3]]
 * returns: (data) => data.title === "foo" && data.level < 3
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

  args.push(`return (data) => ${filters.join(" && ")};`);

  const factory = new Function(...args);

  return factory(...values);
}

/**
 * Convert a parsed condition to a function
 *
 * example: key = "data.title", operator = "=" name = "value0" value = "foo"
 * returns: data.title === value0
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
        return `data.${key}?.getTime() === ${name}.getTime()`;

      case "!=":
        return `data.${key}?.getTime() !== ${name}.getTime()`;

      case "<":
      case "<=":
      case ">":
      case ">=":
        return `data.${key}?.getTime() ${operator} ${name}.getTime()`;

      case "!<":
      case "!<=":
      case "!>":
      case "!>=":
        return `!(data.${key}?.getTime() ${
          operator.substring(1)
        } ${name}.getTime())`;

      default:
        throw new Error(`Operator ${operator} not valid for Date values`);
    }
  }

  if (Array.isArray(value)) {
    switch (operator) {
      case "=":
        return `${name}.some((i) => data.${key} === i)`;

      case "!=":
        return `${name}.some((i) => data.${key} !== i)`;

      case "^=":
        return `${name}.some((i) => data.${key}?.startsWith(i))`;

      case "!^=":
        return `!${name}.some((i) => data.${key}?.startsWith(i))`;

      case "$=":
        return `${name}.some((i) => data.${key}?.endsWith(i))`;

      case "!$=":
        return `!${name}.some((i) => data.${key}?.endsWith(i))`;

      case "*=":
        return `${name}.some((i) => data.${key}?.includes(i))`;

      case "!*=":
        return `${name}.some((i) => data.${key}?.includes(i))`;

      case "!<":
      case "!<=":
      case "!>":
      case "!>=":
        return `!${name}.some((i) => data.${key} ${operator.substring(1)} i)`;

      default: // < <= > >=
        return `${name}.some((i) => data.${key} ${operator} i)`;
    }
  }

  switch (operator) {
    case "=":
      return `data.${key} === ${name}`;

    case "!=":
      return `data.${key} !== ${name}`;

    case "^=":
      return `data.${key}?.startsWith(${name})`;

    case "!^=":
      return `!data.${key}?.startsWith(${name})`;

    case "$=":
      return `data.${key}?.endsWith(${name})`;

    case "!$=":
      return `!data.${key}?.endsWith(${name})`;

    case "*=":
      return `data.${key}?.includes(${name})`;

    case "!*=":
      return `!data.${key}?.includes(${name})`;

    case "!<":
    case "!<=":
    case "!>":
    case "!>=":
      return `!(data.${key} ${operator.substring(1)} ${name})`;

    default: // < <= > >=
      return `data.${key} ${operator} ${name}`;
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
 * returns: (a, b) => a.title > b.title
 */
export function buildSort(sort: string): (a: Data, b: Data) => number {
  let fn = "0";

  const pieces = sort.split(/\s+/).filter((arg) => arg);

  pieces.reverse().forEach((arg) => {
    const match = arg.match(/([\w.-]+)(?:=(asc|desc))?/);

    if (!match) {
      return;
    }

    let [, key, direction] = match;
    key = key.replaceAll(".", "?.");
    const operator = direction === "desc" ? ">" : "<";
    fn =
      `(a.${key} == b.${key} ? ${fn} : (a.${key} ${operator} b.${key} ? -1 : 1))`;
  });

  return new Function("a", "b", `return ${fn}`) as (a: Data, b: Data) => number;
}
