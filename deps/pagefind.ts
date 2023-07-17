import dbin from "https://deno.land/x/dbin@v0.2.0/mod.ts";

export interface DownloadOptions {
  /** Filename of the Pagefind binary file */
  path: string;

  /** Whether download the extended version, with support for Chinese and Japanese languages */
  extended: boolean;

  /** The version of Pagefind to download */
  version: string;
}

export default async function downloadBinary(
  options: DownloadOptions,
): Promise<string> {
  const { path, extended, version } = options;
  const prefix = extended ? "_extended" : "";
  const isPrerelease = /v\d+\.\d+\.\d+-.+$/.test(version);
  const repository = isPrerelease ? "pagefind-beta" : "pagefind";

  return await dbin({
    pattern:
      `https://github.com/CloudCannon/${repository}/releases/download/{version}/pagefind${prefix}-{version}-{target}.tar.gz`,
    version,
    targets: [
      { name: "x86_64-unknown-linux-musl", os: "linux", arch: "x86_64" },
      { name: "x86_64-apple-darwin", os: "darwin", arch: "x86_64" },
      { name: "aarch64-unknown-linux-musl", os: "linux", arch: "aarch64" },
      { name: "aarch64-apple-darwin", os: "darwin", arch: "aarch64" },
      { name: "x86_64-pc-windows-msvc", os: "windows" },
    ],
    dest: path,
  });
}
