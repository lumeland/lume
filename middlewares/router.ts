import { posix } from "../deps/path.ts";

import type { Middleware } from "../core/server.ts";

interface RouterParams {
  request: Request;
  [key: string]: unknown;
}

type RouteHandler<T = RouterParams> = (
  params: T,
) => Response | Promise<Response>;

type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE";

interface RouteDefinition {
  method: HTTPMethod;
  pattern: URLPattern;
  handler: RouteHandler;
}

export interface Options {
  basePath?: string;
  strict?: boolean;
}

const baseURL = "http://localhost/";

export default class Router {
  routes: RouteDefinition[] = [];
  basePath: string;
  strict: boolean;

  constructor(options?: Options) {
    this.basePath = options?.basePath ?? "/";
    this.strict = options?.strict ?? true;
  }

  add(method: HTTPMethod, pattern: string, handler: RouteHandler) {
    pattern = posix.join("/", this.basePath, pattern);

    if (!this.strict) {
      pattern += "{/}?";
    }

    this.routes.push({
      method,
      pattern: new URLPattern(pattern, baseURL),
      handler,
    });
  }

  get(pattern: string, handler: RouteHandler) {
    this.add("GET", pattern, handler);
  }

  post(pattern: string, handler: RouteHandler) {
    this.add("POST", pattern, handler);
  }

  put(pattern: string, handler: RouteHandler) {
    this.add("PUT", pattern, handler);
  }

  delete(pattern: string, handler: RouteHandler) {
    this.add("DELETE", pattern, handler);
  }

  async exec(request: Request): Promise<Response | undefined> {
    for (const { method, pattern, handler } of this.routes) {
      if (request.method !== method) {
        continue;
      }

      const url = new URL(request.url);
      const result = pattern.exec({
        pathname: url.pathname,
        baseURL,
      });

      if (result) {
        const data = { ...result.pathname?.groups, request };
        return await handler(data);
      }
    }
  }

  middleware(): Middleware {
    return async (request, next) => {
      const response = await this.exec(request);

      if (response) {
        return response;
      }

      return await next(request);
    };
  }
}
