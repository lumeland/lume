import { Page, Site } from "../core.ts";
import { merge } from "../core/utils.ts";

export interface Options {
  /** The helper name */
  name: string;
}

const defaults: Options = {
  name: "search",
};

/** Register the plugin to enable the `search` helpers */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.data(options.name, new Search(site));
  };
}

type Query = string | string[];
type Condition = [string, string, unknown];

/** Search helper */
export class Search {
  #site: Site;
  #cache: Map<string, Page[]> = new Map();

  constructor(site: Site) {
    this.#site = site;

    site.addEventListener("beforeUpdate", () => this.#cache.clear());
  }

  /** Return the data in the scope of a path (file or folder) */
  data(path = "/") {
    const file = this.#site.source.getFileOrDirectory(path);

    if (file) {
      return file.data;
    }
  }

  /** Search pages */
  pages(query?: Query, sort?: Query, limit?: number) {
    const result = this.#searchPages(query, sort);

    if (!limit) {
      return result;
    }

    return (limit < 0) ? result.slice(limit) : result.slice(0, limit);
  }

  /** Returns all tags values of a search */
  tags(query?: Query) {
    const tags = new Set();

    this.pages(query).forEach((page) =>
      page.data.tags!.forEach((tag: string) => tags.add(tag))
    );

    return Array.from(tags);
  }

  /** Return the next page of a search */
  nextPage(url: string, query?: Query, sort?: Query) {
    const pages = this.pages(query, sort);
    const index = pages.findIndex((page) => page.data.url === url);

    return (index === -1) ? undefined : pages[index + 1];
  }

  /** Return the previous page of a search */
  previousPage(url: string, query?: Query, sort?: Query) {
    const pages = this.pages(query, sort);
    const index = pages.findIndex((page) => page.data.url === url);

    return (index <= 0) ? undefined : pages[index - 1];
  }

  #searchPages(query?: Query, sort: Query = "date"): Page[] {
    if (Array.isArray(query)) {
      query = query.join(" ");
    }

    const id = JSON.stringify([query, sort]);

    if (this.#cache.has(id)) {
      return [...this.#cache.get(id)!];
    }

    const filter = buildFilter(query);
    const result = filter ? this.#site.pages.filter(filter) : this.#site.pages;

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
export function buildFilter(query?: string): (page: Page) => boolean {
  // (?:(fieldName)(operator))?(value|"value"|'value')
  const matches = query
    ? query.matchAll(
      /(?:([\w.-]+)([!^$*]?=|[<>]=?))?([^'"\s][^\s=<>]*|"[^"]+"|'[^']+')/g,
    )
    : [];

  // Always return html pages
  const conditions: Condition[] = [["dest.ext", "=", ".html"]];

  for (const match of matches) {
    let [, key, operator, value] = match;

    if (!key) {
      key = "tags";
      operator = "*=";
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

      case "$=":
        return `${name}.some((i) => page.${key}?.endsWith(i))`;

      case "*=":
        return `${name}.some((i) => page.${key}?.includes(i))`;

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

    case "$=":
      return `page.${key}?.endsWith(${name})`;

    case "*=":
      return `page.${key}?.includes(${name})`;

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
  value = value.replace(/^('|")(.*)\1$/, "$2");

  if (value.includes("|")) {
    return value.split("|").map((val) => compileValue(val));
  }
  if (value.toLowerCase() === "true") {
    return true;
  }
  if (value.toLowerCase() === "false") {
    return false;
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
