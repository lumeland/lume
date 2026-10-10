import { dirname, join } from "node:path";
import { writeFile, mkdir, rm, cp } from "node:fs/promises";
import { cwd } from "node:process";
import { Readable } from "node:stream";
import { createGunzip } from "node:zlib";
import tar from "tar-stream";
import JSZip from "jszip";

interface File {
  name: string;
  text: () => Promise<string>;
}

export async function* getZipFiles(
  url: string,
  filter: (relativePath: string, file: JSZip.JSZipObject) => boolean = () => true,
): AsyncGenerator<File> {
  const blob = await (await fetch(url)).blob();
  const zip = new JSZip();
  await zip.loadAsync(new Uint8Array(await blob.arrayBuffer()));

  // Get all files
  for (const file of zip.filter(filter)) {
    if (file.dir) {
      continue;
    }

    yield {
      name: file.name.match(/^[^/]+(.*)/)?.[1] ?? file.name,
      text: () => file.async("string"),
    };
  }
}

export async function saveFile(root: string, file: string, content: string): Promise<void> {
  const path = join(cwd(), root, file);
  try {
    await mkdir(dirname(path), { recursive: true });
  } catch {
    // Ignore
  }
  await writeFile(path, content);
}

export async function remove(root: string, paths: string[] = []): Promise<void> {
  for (const path of paths) {
    try {
      await rm(join(root, path), { recursive: true });
    } catch {
      // Ignore
    }
  }
}

export async function* fromJsr(name: string): AsyncGenerator<File> {
  const json = await (await fetch(`https://jsr.io/${name}/meta.json`)).json();
  const version = json.latest;
  const pkgName = `@jsr/${name.replace("/", "__").replace("@", "")}`;
  const url = `https://npm.jsr.io/~/11/${pkgName}/${version}.tgz`;

  const body = (await fetch(url)).body;

  const input = Readable.fromWeb(body as any);
  const gunzip = createGunzip();
  const extract = tar.extract();
  input.pipe(gunzip).pipe(extract);

  for await (const entry of extract) {
    const chunks: Buffer[] = [];
    for await (const chunk of entry) {
      chunks.push(Buffer.from(chunk));
    }

    if (entry.header.type !== "file") continue;

    const bytes = Buffer.concat(chunks);

    yield {
      name: entry.header.name.replace(/^package/, ""),
      text: async () => bytes.toString("utf8"),
    };
  }
}

export async function copyFolder(from: string, to: string): Promise<void> {
  await cp(from, to, { recursive: true });
}
