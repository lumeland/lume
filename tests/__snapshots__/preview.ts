const name = Deno.args[0];
const key = Deno.args[1] ? parseInt(Deno.args[1]) : undefined;

const file = `./${name}.test.ts.snap`;
const mod = await import(file);
const { snapshot } = mod;

const snapshots = Object.values(snapshot) as string[];

if (key) {
  show(snapshots[key]);
} else {
  for (const value of snapshots) {
    show(value);
  }
}

function show(snapshot: string) {
  console.log(snapshot.replaceAll("\\n", "\n"));
}
