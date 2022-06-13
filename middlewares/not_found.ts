import { dirname, join, posix } from "../deps/path.ts";

import type { Middleware } from "../core.ts";

export interface Options {
  root: string;
  page404: string;
  directoryIndex?: boolean;
}

/** Show a 404 page */
export default function notFound(options: Options): Middleware {
  let { root, page404, directoryIndex } = options;

  if (page404.endsWith("/")) {
    page404 += "index.html";
  }

  return async (request, next) => {
    const response = await next(request);

    if (response.status === 404) {
      const { headers, status } = response;
      headers.set("content-type", "text/html");

      try {
        const body = await Deno.readFile(join(root, page404));
        return new Response(body, { status, headers });
      } catch {
        if (directoryIndex) {
          const { pathname } = new URL(request.url);
          const body = await getDirectoryIndex(root, pathname);
          return new Response(body, { status, headers });
        }
      }
    }

    return response;
  };
}

/** Generate the default body for a 404 response */
async function getDirectoryIndex(root: string, file: string): Promise<string> {
  const folders: [string, string][] = [];
  const files: [string, string][] = [];

  try {
    for await (const info of Deno.readDir(join(root, file))) {
      info.isDirectory
        ? folders.push([`${info.name}/`, `📁 ${info.name}/`])
        : files.push([
          info.name === "index.html" ? "./" : info.name,
          `📄 ${info.name}`,
        ]);
    }
  } catch {
    // It's not a directory, so scan the parent directory
    try {
      const base = posix.dirname(file);
      for await (const info of Deno.readDir(join(root, base))) {
        info.isDirectory
          ? folders.push([posix.join(base, `${info.name}/`), `📁 ${info.name}/`])
          : files.push([
            posix.join(base, info.name === "index.html" ? "./" : info.name),
            `📄 ${info.name}`,
          ]);
      }
    } catch {
      // Ignore
    }
  }

  const content = folders.concat(files);

  if (file.match(/.+\/.+/)) {
    content.unshift(["../", ".."]);
  }

  return `
  <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>404 - Not found</title>
      <style> body { font-family: sans-serif; max-width: 40em; margin: auto; padding: 2em; line-height: 1.5; }</style>
    </head>
    <body>
      <h1>404 - Not found</h1>
      <p>The URL <code>${file}</code> does not exist</p>
      <ul>
    ${
    content.map(([url, name]) => `
      <li>
        <a href="${url}">
          ${name}
        </a>
      </li>`).join("\n")
  }
      </ul>
    </body>
  </html>`;
}
