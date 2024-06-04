import { upgrade } from "../deps/init.ts";

interface Options {
  dev?: boolean;
  version?: string;
}

export default function ({ dev, version }: Options) {
  return upgrade({ dev, version });
}
