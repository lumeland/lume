/** Read a binary file */
export async function readFile(file: string): Promise<Uint8Array<ArrayBuffer>> {
  return await Deno.readFile(file);
}

/** Read a binary file (sync version) */
export function readFileSync(file: string): Uint8Array<ArrayBuffer> {
  return Deno.readFileSync(file);
}

/** Read a text file */
export async function readTextFile(file: string): Promise<string> {
  try {
    return await Deno.readTextFile(file);
  } catch (error) {
    throw new FsError(error as Error);
  }
}

/** Read a text file (sync version) */
export function readTextFileSync(file: string): string {
  return Deno.readTextFileSync(file);
}

/** Write a binary file */
export async function writeFile(file: string, content: Uint8Array, createNew?: boolean): Promise<void> {
  try {
    await Deno.writeFile(file, content, { createNew });
  } catch (error) {
    throw new FsError(error as Error);
  }
}

/** Write a binary file (sync version) */
export function writeFileSync(file: string, content: Uint8Array): void {
  Deno.writeFileSync(file, content);
}

/** Write a text file */
export async function writeTextFile(file: string, content: string, createNew?: boolean): Promise<void> {
  try {
    await Deno.writeTextFile(file, content, { createNew });
  } catch (error) {
    throw new FsError(error as Error);
  }
}

/** Write a text file (sync version) */
export function writeTextFileSync(file: string, content: string): void {
  Deno.writeTextFileSync(file, content);
}

/** Remove a file or folder */
export async function remove(file: string, recursive?: boolean): Promise<void> {
  await Deno.remove(file, { recursive });
}

/** Remove a file or folder (sync version) */
export function removeSync(file: string, recursive?: boolean): void {
  Deno.removeSync(file, { recursive });
}

export class FsError extends Error {
  constructor(cause: Error) {
    super(cause.message);
    this.cause = cause;
  }

  get code() {
    if (this.cause instanceof Deno.errors.NotFound) return "not-found";
    if (this.cause instanceof Deno.errors.AlreadyExists) return "exists";
    return "other"
  }
}
