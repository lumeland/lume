export { compile } from "npm:@tailwindcss/node@4.0.3";

import dbin from "https://deno.land/x/dbin@v0.3.0/mod.ts";

const tailwind = "npm:@tailwindcss/cli@4.0.3";
const version = `v${tailwind.split("@").pop()}`;

export async function getBinary(dest: string) {
  return await dbin({
    pattern:
      "https://github.com/tailwindlabs/tailwindcss/releases/download/{version}/tailwindcss-{target}",
    version,
    targets: [
      { name: "linux-x64", os: "linux", arch: "x86_64" },
      { name: "linux-arm64", os: "linux", arch: "aarch64" },
      { name: "macos-x64", os: "darwin", arch: "x86_64" },
      { name: "macos-arm64", os: "darwin", arch: "aarch64" },
      { name: "windows-x64.exe", os: "windows", arch: "x86_64" },
    ],
    dest,
  });
}
