const res = await fetch(
  "https://data.jsdelivr.com/v1/package/gh/lumeland/init",
);
const data = await res.json();
const version = data.versions.shift();
const { run } = await import(
  `https://cdn.jsdelivr.net/gh/lumeland/init@${version}/mod.ts`
);
const { default: upgrade } = await import(
  `https://cdn.jsdelivr.net/gh/lumeland/init@${version}/upgrade.ts`
);

export { run, upgrade };
