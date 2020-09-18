const multipleArgs = new Set(["class"]);
const escapeChars = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&#34;",
  "'": "&#39;",
};

export default function attributes(values, ...validNames) {
  const attributes = new Map();

  handle(attributes, values, validNames);

  return join(attributes);
}

function handle(attributes, name, validNames) {
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
    return name.forEach((value) => handle(attributes, value, validNames));
  }

  for (let [key, value] of Object.entries(name)) {
    if (!isValid(key, validNames)) {
      continue;
    }
    if (multipleArgs.has(key)) {
      addMultiple(attributes, key, value);
      continue;
    }

    attributes.set(key, value);
  }
}

function addMultiple(attributes, name, value) {
  if (typeof value === "string") {
    const attr = attributes.get(name) || new Set();
    attr.add(value);
    attributes.set(name, attr);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((val) => addMultiple(attributes, name, val));
    return;
  }

  for (let [key, val] of Object.entries(value)) {
    if (val) {
      const attr = attributes.get(name) || new Set();
      attr.add(key);
      attributes.set(name, attr);
    }
  }
}

function join(attributes) {
  const values = [];

  for (let [name, value] of attributes) {
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

    values.push(`${name}="${escape(value)}"`);
  }

  return values.join(" ");
}

function escape(value) {
  return value.replace(/[&<>'"]/g, (match) => escapeChars[match]);
}

function isValid(name, validNames) {
  return name && (!validNames.length || validNames.includes(name));
}
