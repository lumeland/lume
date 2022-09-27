import { createSite } from "./utils.ts";

interface Options {
  config?: string;
}

export default function ({ config }: Options, scripts: string[]) {
  return run(config, scripts);
}

/** Run one or more custom scripts */
export async function run(
  config: string | undefined,
  scripts: string[],
) {
  const site = await createSite(config);
  console.log();

  for (const script of scripts) {
    const success = await site.run(script);

    if (!success) {
      addEventListener("unload", () => Deno.exit(1));
      break;
    }
  }
}
