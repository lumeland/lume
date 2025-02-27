import { env } from "./env.ts";

const tokenCache = new Map<string, string>();
const denoAuthTokens = env<string>("DENO_AUTH_TOKENS");
if (denoAuthTokens) {
  const tokens = denoAuthTokens.split(";");
  for (const token of tokens) {
    const [credentials, host] = token.split("@");
    if (credentials.includes(":")) {
      // Basic Auth
      const encodedCredentials = btoa(credentials);
      tokenCache.set(host, `Basic ${encodedCredentials}`);
    } else {
      // Bearer Token
      tokenCache.set(host, `Bearer ${credentials}`);
    }
  }
}

export class tokens {
  static get(host: string): string | undefined {
    return tokenCache.get(host);
  }
}
