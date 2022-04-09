/**
 * This code is a modified version of the original code that is deprecated.
 *
 * Source: https://deno.land/std@0.134.0/fs/copy.ts
 * Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
 *
 * - Removed the `preserveTimestamps` option, as it is an unstable feature.
 * - Removed useless `_utils` dependencies.
 */
import * as path from "./path.ts";
import { ensureDir } from "./fs.ts";

const isWindows = Deno.build.os === "windows";

export interface CopyOptions {
  /**
   * overwrite existing file or directory. Default is `false`
   */
  overwrite?: boolean;
}

interface InternalCopyOptions extends CopyOptions {
  /**
   * default is `false`
   */
  isFolder?: boolean;
}

async function ensureValidCopy(
  src: string,
  dest: string,
  options: InternalCopyOptions,
): Promise<Deno.FileInfo | undefined> {
  let destStat: Deno.FileInfo;

  try {
    destStat = await Deno.lstat(dest);
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return;
    }
    throw err;
  }

  if (options.isFolder && !destStat.isDirectory) {
    throw new Error(
      `Cannot overwrite non-directory '${dest}' with directory '${src}'.`,
    );
  }
  if (!options.overwrite) {
    throw new Error(`'${dest}' already exists.`);
  }

  return destStat;
}

/* copy file to dest */
async function copyFile(
  src: string,
  dest: string,
  options: InternalCopyOptions,
) {
  await ensureValidCopy(src, dest, options);
  await Deno.copyFile(src, dest);
}

/* copy symlink to dest */
async function copySymLink(
  src: string,
  dest: string,
  options: InternalCopyOptions,
) {
  await ensureValidCopy(src, dest, options);
  const originSrcFilePath = await Deno.readLink(src);
  const info = await Deno.lstat(src);
  if (isWindows) {
    await Deno.symlink(originSrcFilePath, dest, {
      type: info.isDirectory ? "dir" : "file",
    });
  } else {
    await Deno.symlink(originSrcFilePath, dest);
  }
}

/* copy folder from src to dest. */
async function copyDir(
  src: string,
  dest: string,
  options: CopyOptions,
) {
  const destStat = await ensureValidCopy(src, dest, {
    ...options,
    isFolder: true,
  });

  if (!destStat) {
    await ensureDir(dest);
  }

  for await (const entry of Deno.readDir(src)) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, path.basename(srcPath as string));
    if (entry.isSymlink) {
      await copySymLink(srcPath, destPath, options);
    } else if (entry.isDirectory) {
      await copyDir(srcPath, destPath, options);
    } else if (entry.isFile) {
      await copyFile(srcPath, destPath, options);
    }
  }
}

/**
 * Copy a file or directory. The directory can have contents. Like `cp -r`.
 * Requires the `--allow-read` and `--allow-write` flag.
 * @param src the file/directory path.
 *            Note that if `src` is a directory it will copy everything inside
 *            of this directory, not the entire directory itself
 * @param dest the destination path. Note that if `src` is a file, `dest` cannot
 *             be a directory
 * @param options
 */
export async function copy(
  src: string,
  dest: string,
  options: CopyOptions = {},
) {
  src = path.resolve(src);
  dest = path.resolve(dest);

  if (src === dest) {
    throw new Error("Source and destination cannot be the same.");
  }

  try {
    const srcStat = await Deno.lstat(src);

    if (srcStat.isDirectory && dest.startsWith(src)) {
      throw new Error(
        `Cannot copy '${src}' to a subdirectory of itself, '${dest}'.`,
      );
    }

    if (srcStat.isSymlink) {
      await copySymLink(src, dest, options);
    } else if (srcStat.isDirectory) {
      await copyDir(src, dest, options);
    } else if (srcStat.isFile) {
      await copyFile(src, dest, options);
    }
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return false;
    }

    throw err;
  }
}
