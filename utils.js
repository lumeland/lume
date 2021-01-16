import { bold, red } from "./deps/colors.js";

export async function concurrent(iterable, iteratorFn, limit = 200) {
  const executing = [];

  for await (const item of iterable) {
    const p = iteratorFn(item).then(() =>
      executing.splice(executing.indexOf(p), 1)
    );

    executing.push(p);

    if (executing.length >= limit) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
}

export const mimes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".png", "image/png"],
  [".jpg", "image/jpg"],
  [".jpeg", "image/jpg"],
  [".gif", "image/gif"],
  [".svg", "image/svg+xml"],
  [".mp3", "audio/mpeg"],
  [".mp4", "video/mpeg"],
  [".xml", "text/xml"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".wasm", "application/wasm"],
  [".webp", "image/webp"],
  [".webm", "video/webm"],
  [".zip", "application/zip"],
]);

export const cache = new Map();

export async function readFile(path, fn = (content) => content) {
  if (cache.has(path)) {
    return cache.get(path);
  }

  try {
    const content = await fn(await Deno.readTextFile(path));
    cache.set(path, content);
    return content;
  } catch (err) {
    console.error(`Error loading the template ${path}`);
    console.error(err);
  }
}

export async function loadModule(path, fn = (content) => content) {
  if (cache.has(path)) {
    return cache.get(path);
  }

  const hash = new Date().getTime();
  const content = fn(await import(`file://${path}#${hash}`));
  cache.set(path, content);
  return content;
}

export function error(context, message, exception) {
  console.error(bold(red(`${context}:`)), message);
  if (exception) {
    console.error(exception);
  }
  console.error("");
}
