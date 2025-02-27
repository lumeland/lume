import { env } from "./env.ts";

const tokens = new Map<string, string>();
const denoAuthTokens = env<string>("DENO_AUTH_TOKENS");
if (denoAuthTokens) {
  const authTokens = denoAuthTokens.split(";");
  for (const token of authTokens) {
    const [credentials, host] = token.split("@");
    if (credentials.includes(":")) {
      // Basic Auth
      const encodedCredentials = btoa(credentials);
      tokens.set(host, `Basic ${encodedCredentials}`);
    } else {
      // Bearer Token
      tokens.set(host, `Bearer ${credentials}`);
    }
  }
}

export { tokens };
