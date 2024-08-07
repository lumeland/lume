import type { Middleware } from "../core/server.ts";

interface Options {
  page: string;
  retryAfter: number;
}

const defaults: Options = {
  page: "/503.html",
  retryAfter: 60 * 60 * 24, // 24 hours
};

export function shutdown(
  userOptions?: Partial<Options>,
): Middleware {
  const options = { ...defaults, ...userOptions };

  return async (request, next) => {
    if (!isHtml(request)) {
      return await next(request);
    }

    const url = new URL(options.page, request.url).toString();
    const response = await next(new Request(url, request));

    const { body, headers } = response;
    headers.set("Retry-After", options.retryAfter.toString());

    return new Response(body, {
      status: 503,
      statusText: "Service Unavailable",
      headers,
    });
  };
}

function isHtml(request: Request) {
  const accept = request.headers.get("accept");
  return accept && accept.includes("text/html");
}

export default shutdown
