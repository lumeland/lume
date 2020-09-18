export default function className(...names) {
  const classes = new Set();

  names.forEach((name) => handle(classes, name));

  return Array.from(classes).join(" ");
}

function handle(classes, name) {
  if (!name) {
    return;
  }

  if (typeof name === "string") {
    return classes.add(name);
  }

  if (Array.isArray(name)) {
    return name.forEach((value) => handle(classes, value));
  }

  for (let [key, value] of Object.entries(name)) {
    if (value) {
      classes.add(key);
    }
  }
}
