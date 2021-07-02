import Site from "../site.ts";
import { Helper } from "../types.ts";

const escapeChars: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&#34;",
  "'": "&#39;",
};

/**
 * Plugin to register the filters "attrs" and "class"
 * that allows to handle html attributes and class names easily
 */
export default function () {
  return (site: Site) => {
    site.filter("attr", attributes as Helper);
    site.filter("class", classNames);
  };
}

function attributes(values: unknown, ...validNames: string[]) {
  const attributes = new Map();

  handleAttributes(attributes, values, validNames);

  return joinAttributes(attributes);
}

function classNames(...names: unknown[]) {
  const classes: Set<string> = new Set();

  names.forEach((name) => handleClass(classes, name));

  return Array.from(classes).join(" ");
}

function handleClass(classes: Set<string>, name: unknown): void {
  if (!name) {
    return;
  }

  if (typeof name === "string") {
    classes.add(name);
    return;
  }

  if (Array.isArray(name)) {
    return name.forEach((value) => handleClass(classes, value));
  }

  for (const [key, value] of Object.entries(name as Record<string, unknown>)) {
    if (value) {
      classes.add(key);
    }
  }
}

function handleAttributes(
  attributes: Map<string, unknown>,
  name: unknown,
  validNames: string[],
): void {
  if (!name) {
    return;
  }

  if (typeof name === "string") {
    if (isValid(name, validNames)) {
      attributes.set(name, true);
    }
    return;
  }

  if (Array.isArray(name)) {
    return name.forEach((value) =>
      handleAttributes(attributes, value, validNames)
    );
  }

  for (const [key, value] of Object.entries(name as Record<string, unknown>)) {
    if (!isValid(key, validNames)) {
      continue;
    }

    if (key === "class") {
      const classList = (attributes.get("class") || new Set()) as Set<string>;
      handleClass(classList, value);
      attributes.set("class", classList);
      continue;
    }

    attributes.set(key, value);
  }
}

function joinAttributes(attributes: Map<string, unknown>) {
  const values = [];

  for (const [name, value] of attributes) {
    if (value === undefined || value === null || value === false) {
      continue;
    }

    if (value === true) {
      values.push(name);
      continue;
    }

    if (value instanceof Set) {
      if (value.size) {
        values.push(`${name}="${escape(Array.from(value).join(" "))}"`);
      }
      continue;
    }

    values.push(`${name}="${escape(value as string)}"`);
  }

  return values.join(" ");
}

function escape(value: string) {
  return value.replace(/[&<>'"]/g, (match) => escapeChars[match]);
}

function isValid(name: string, validNames: string[]) {
  return name && (!validNames.length || validNames.includes(name));
}
