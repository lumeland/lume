import { log } from "../core/utils/log.ts";
import { runPipedCommand } from "../services/process.ts";

import type Site from "../core/site.ts";

export interface GitInfo {
  branch: string;
  hash: string;
  tag?: string;
}

export function gitInfo() {
  return (site: Site) => {
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

function gitCommand(...args: string[]): string {
  const [success, error] = runPipedCommand("git", args);

  if (success) {
    return success;
  }

  log.error(`[git_info plugin] Git error: ${error}`);
  return "";
}

/** Extends global data interface */
declare global {
  namespace Lume {
    export interface GlobalData {
      /**
       * GIT info
       * @see https://lume.land/plugins/git_info/
       */
      gitInfo: GitInfo;
    }
  }
}
