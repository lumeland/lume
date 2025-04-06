// const res = await fetch(
//   `https://cdn.deno.land/lume_init/meta/versions.json`,
// );
// const versions = await res.json();
// const { run } = await import(
//   `https://deno.land/x/lume_init@${versions.latest}/mod.ts`
// );
// const { default: upgrade } = await import(
//   `https://deno.land/x/lume_init@${versions.latest}/upgrade.ts`
// );

const commit = "403e341954d9ff04da4ce7bcf46fe1ebdf9f9918";

const { run } = await import(
  `https://data.jsdelivr.com/v1/package/gh/${commit}/mod.ts`
);
const { default: upgrade } = await import(
  `https://data.jsdelivr.com/v1/package/gh/${commit}/upgrade.ts`
);

export { run, upgrade };
