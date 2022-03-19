import { createSite } from "./utils.ts";

interface Options {
  root: string;
  config?: string;
}

export default function ({ root, config }: Options, scripts: string[]) {
  return run(root, config, scripts);
}

/** Run one or more custom scripts */
export async function run(
  root: string,
  config: string | undefined,
  scripts: string[],
) {
  const site = await createSite(root, config);
  console.log();

  for (const script of scripts) {
    const success = await site.run(script);

    if (!success) {
      addEventListener("unload", () => Deno.exit(1));
      break;
    }
  }
}
