export async function concurrent(iterable, iteratorFn, limit = 200) {
  const executing = [];

  for await (const item of iterable) {
    const p = iteratorFn(item).then(() =>
      executing.splice(executing.indexOf(p), 1)
    );

    executing.push(p);

    if (executing.length >= limit) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
}

export async function runScript(options = {}) {
  const cmd = Array.from(options.cmd.matchAll(/('([^']*)'|"([^"]*)"|[\S]+)/g))
    .map((piece) => piece[2] || piece[1]);
  const process = Deno.run({
    ...options,
    cmd,
  });
  const result = await process.status();
  process.close();
  return result;
}
