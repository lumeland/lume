import type { Middleware } from "../core.ts";

const HOUR = 3600000;
const DAY = HOUR * 24;
const WEEK = DAY * 7;

export interface Options {
  /** The default duration for unknown types */
  defaultDuration: number;

  /** List of types with the cache duration */
  durations: Record<string, number>;
}

export const defaults: Options = {
  defaultDuration: WEEK,
  durations: {
    "text/html": 0,
    "application/json": 0,
    "application/xml": 0,
    "application/atom+xml": HOUR,
    "application/rdf+xml": HOUR,
    "application/rss+xml": HOUR,
  },
};

/** Set the Expires header for better caching */
export default function expires(userOptions?: Partial<Options>): Middleware {
  const options = { ...defaults, ...userOptions };

  return async (request, next) => {
    const response = await next(request);
    const { headers } = response;
    const type = headers.get("Content-Type");
    const duration = (type && options.durations[type]) ||
      options.defaultDuration;
    headers.set("Expires", new Date(Date.now() + duration).toUTCString());

    return response;
  };
}
