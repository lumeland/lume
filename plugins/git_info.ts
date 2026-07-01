import { merge } from "../core/utils/object.ts";
import { log } from "../core/utils/log.ts";

import type Site from "../core/site.ts";

export interface Options {
  varName?: string;
  branchPrefix?: string;
  shortHash?: boolean;
}

export interface GitInfo {
  branch: string;
  hash: string;
}

export const defaults = {
  varName: "git",
  branchPrefix: "lumecms/",
  shortHash: true,
} satisfies Options;

export function gitInfo(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const rawBranch = gitCommand("branch", "--show-current");
    const branch =
      options.branchPrefix && rawBranch.startsWith(options.branchPrefix)
        ? rawBranch.slice(options.branchPrefix.length)
        : rawBranch;

    const hash = gitCommand(
      "rev-parse",
      options.shortHash ? "--short" : "--verify",
      "HEAD",
    );

    const info: GitInfo = {
      branch,
      hash,
    };

    site.data(options.varName, info);
  };
}

export default gitInfo;

const decoder = new TextDecoder();

function gitCommand(...args: string[]): string {
  const { code, stderr, stdout } = new Deno.Command("git", {
    args,
    stdout: "piped",
    stderr: "piped",
  }).outputSync();

  if (code !== 0) {
    log.error(`[git_info plugin] Git error: ${decoder.decode(stderr)}`);
    return "";
  }

  return decoder.decode(stdout).trim();
}
