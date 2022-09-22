import dbin from "https://deno.land/x/dbin@v0.2.0/mod.ts";

export default async function downloadBinary(
  dest: string,
  extended: boolean,
): Promise<string> {
  const prefix = extended ? "_extended" : "";

  return await dbin({
    pattern:
      `https://github.com/CloudCannon/pagefind/releases/download/{version}/pagefind${prefix}-{version}-{target}.tar.gz`,
    version: "v0.8.1",
    targets: [
      { name: "x86_64-unknown-linux-musl", os: "linux" },
      { name: "x86_64-apple-darwin", os: "darwin" },
      { name: "x86_64-pc-windows-msvc", os: "windows" },
    ],
    dest,
  });
}
