const escapeChars = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&#34;",
  "'": "&#39;",
};

export default function () {
  return (site) => {
    site.filter("attr", attributes);
    site.filter("class", classNames);
  };
}

function attributes(values, ...validNames) {
  const attributes = new Map();

  handleAttributes(attributes, values, validNames);

  return joinAttributes(attributes);
}

function classNames(...names) {
  const classes = new Set();

  names.forEach((name) => handleClass(classes, name));

  return Array.from(classes).join(" ");
}

function handleClass(classes, name) {
  if (!name) {
    return;
  }

  if (typeof name === "string") {
    return classes.add(name);
  }

  if (Array.isArray(name)) {
    return name.forEach((value) => handleClass(classes, value));
  }

  for (let [key, value] of Object.entries(name)) {
    if (value) {
      classes.add(key);
    }
  }
}

function handleAttributes(attributes, name, validNames) {
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

  for (let [key, value] of Object.entries(name)) {
    if (!isValid(key, validNames)) {
      continue;
    }

    if (key === "class") {
      const classList = attributes.get("class") || new Set();
      handleClass(classList, value);
      attributes.set("class", classList);
      continue;
    }

    attributes.set(key, value);
  }
}

function joinAttributes(attributes) {
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
