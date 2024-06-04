import { upgrade } from "../deps/init.ts";

export default async function (dev?: boolean, version?: string) {
  const process = upgrade({ path: ".", dev, version });
  await process.run();
}
