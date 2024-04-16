console.warn(
  "This module is deprecated. Use `deno run -A https://lume.land/init.ts` instead.",
);

const res = await fetch(
  `https://cdn.deno.land/lume_init/meta/versions.json`,
);
const versions = await res.json();
const { run } = await import(
  `https://deno.land/x/lume_init@${versions.latest}/mod.ts`
);
run();
