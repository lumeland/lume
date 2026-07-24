import { log } from "../core/utils/log.ts";

import type Site from "../core/site.ts";

export interface GitInfoPluginData {
  gitInfo: GitInfo;
}

export interface GitInfo {
  branch: string;
  hash: string;
  tag?: string;
}

export function gitInfo() {
  return <D extends GitInfoPluginData>(site: Site<D>) => {
    const branch = gitCommand("branch", "--show-current");
    const hash = gitCommand(
      "rev-parse",
      "--verify",
      "HEAD",
    );
    const tag = gitCommand(
      "tag",
      "--points-at",
      hash,
    ) || undefined;

    const info: GitInfo = {
      branch,
      hash,
      tag,
    };

    site.data("gitInfo", info);
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

/** Extends Data interface */
declare global {
  namespace Lume {
    export interface Data {
      /**
       * GIT info
       * @see https://lume.land/plugins/git_info/
       */
      gitInfo: GitInfo;
    }
  }
}
