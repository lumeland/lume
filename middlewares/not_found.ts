import { join, posix } from "../deps/path.ts";
import { merge } from "../core/utils/object.ts";

import type { Middleware } from "../core/server.ts";

export interface Options {
  /** The root folder to look for the 404 page */
  root: string;
  /** The path to the 404 page */
  page404: string;
  /** Show the directory index if the page404 is not found */
  directoryIndex?: boolean;
}

export const defaults: Options = {
  root: `${Deno.cwd()}/_site`,
  page404: "/404.html",
  directoryIndex: false,
};

/** Show a 404 page */
export function notFound(userOptions?: Partial<Options>): Middleware {
  const options = merge(defaults, userOptions);
  let { root, page404, directoryIndex } = options;

  if (page404.endsWith("/")) {
    page404 += "index.html";
  }

  return async (request, next) => {
    const response = await next(request);

    if (response.status === 404) {
      const { headers, status } = response;
      headers.set("content-type", "text/html; charset=utf-8");

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
  const folderIcon =
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><use xlink:href="#icon-folder"></use></svg>`;
  const fileIcon =
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><use xlink:href="#icon-file"></use></svg>`;

  try {
    for await (const info of Deno.readDir(join(root, file))) {
      info.isDirectory
        ? folders.push([`${info.name}/`, `${folderIcon} ${info.name}/`])
        : files.push([
          info.name === "index.html" ? "./" : info.name,
          `${fileIcon} ${info.name}`,
        ]);
    }
  } catch {
    // It's not a directory, so scan the parent directory
    try {
      const base = posix.dirname(file);
      for await (const info of Deno.readDir(join(root, base))) {
        info.isDirectory
          ? folders.push([
            posix.join(base, `${info.name}/`),
            `${folderIcon} ${info.name}/`,
          ])
          : files.push([
            posix.join(base, info.name === "index.html" ? "./" : info.name),
            `${fileIcon} ${info.name}`,
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
      <style>
        html {
          color-scheme: light dark;
        }
        body {
          font-family: sans-serif;
          max-width: 40em;
          margin: auto;
          padding: 2em;
          line-height: 1.5;
        }
        h1 {
          margin-bottom: 0;
        }
        ul {
          margin: 2em 0;
          padding: 0;
          list-style-type: "";
        }
        li a {
          display: flex;
          align-items: center;
          column-gap: 0.5em;
          text-decoration: none;
          &:hover {
            text-decoration: underline;
          }
        }
      </style>
    </head>
    <body>
      <svg display="none">
        <defs>
          <g id="icon-file">
            <path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Z"/>
          </g>
          <g id="icon-folder">
            <path d="M232,88V200.89A15.13,15.13,0,0,1,216.89,216H40a16,16,0,0,1-16-16V64A16,16,0,0,1,40,48H93.33a16.12,16.12,0,0,1,9.6,3.2L130.67,72H216A16,16,0,0,1,232,88Z"></path>
          </g>
        </defs>
      </svg>
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

export default notFound;
