import type { Middleware } from "../core.ts";

export interface Options {
  add: boolean;
  code: 301 | 302;
}

export const defaults: Options = {
  add: false,
  code: 301,
};

/** Middleware to add/remove the www. domain */
export default function www(userOptions?: Partial<Options>): Middleware {
  const options = { ...defaults, ...userOptions };

  return async (request, next) => {
    const url = new URL(request.url);

    if (url.hostname.startsWith("www.")) {
      if (!options.add) {
        url.hostname = url.hostname.replace("www.", "");
        return new Response(null, {
          status: options.code,
          headers: {
            location: url.toString(),
          },
        });
      }
    } else if (options.add) {
      url.hostname = `www.${url.hostname}`;
      return new Response(null, {
        status: options.code,
        headers: {
          location: url.toString(),
        },
      });
    }

    return await next(request);
  };
}
