import type { RequestHandler, ServerResponse } from "./mod.ts";
import { brightGreen, dim, red } from "../deps/colors.ts";
import { mimes } from "../core/utils.ts";
import { extname } from "../deps/path.ts";

/** Add a header to prevent the browser cache */
export async function noCache(
  req: Request,
  next: RequestHandler,
): Promise<ServerResponse> {
  const response = await next(req);
  response.headers.set("cache-control", "no-cache no-store must-revalidate");
  return response;
}

/** Log the request/responses */
export async function log(
  req: Request,
  next: RequestHandler,
): Promise<ServerResponse> {
  try {
    const response = await next(req);
    const { pathname } = new URL(req.url);
    const { status } = response;

    if (status === 404 || status === 500) {
      console.log(`${red(status.toString())} ${pathname}`);
    } else if (status === 200) {
      console.log(`${brightGreen(status.toString())} ${pathname}`);
    } else if (status === 301 || status === 302) {
      console.log(
        `${dim(status.toString())} ${pathname} => ${
          response.headers?.get("location")
        }`,
      );
    } else {
      console.log(`${dim(status.toString())} ${pathname}`);
    }

    return response;
  } catch (cause) {
    return {
      status: 500,
      headers: new Headers(),
      body: `Error: ${cause.toString()}`,
    };
  }
}

/** Add the Content-Type header */
export async function contentType(
  req: Request,
  next: RequestHandler,
): Promise<ServerResponse> {
  const response = await next(req);
  const { pathname } = new URL(req.url);
  const ext = extname(pathname).toLowerCase();
  const contentType = ext
    ? mimes.get(ext) || "application/octet-stream"
    : mimes.get(".html")!;
  response.headers.set("Content-Type", contentType);
  return response;
}

/** Adds the Content-Length header */
export async function contentLength(
  req: Request,
  next: RequestHandler,
): Promise<ServerResponse> {
  const response = await next(req);
  const { body } = response;

  if (!body) {
    return response;
  }

  const length = getLength(body);

  if (length) {
    response.headers.set("Content-Length", length);
  }

  return response;
}

function getLength(body: BodyInit): string | undefined {
  if (typeof body === "string") {
    return body.length.toString();
  }
  if (body instanceof ArrayBuffer) {
    return body.byteLength.toString();
  }
  if (body instanceof Blob) {
    return body.size.toString();
  }
}
