import type { Entry } from "../core.ts";

/**
 * Define independent updates scopes
 * This optimize the update process after any change
 */
export default class Scopes {
  scopes = new Set<ScopeFilter>();

  /** Returns a function to filter the pages that must be rebuild */
  getFilter(changedFiles: Iterable<string>): (entry: Entry) => boolean {
    // There's no any scope, so rebuild all pages
    if (this.scopes.size === 0) {
      return () => true;
    }

    let noScoped = false;
    const changed = new Set<ScopeFilter>();

    for (const file of changedFiles) {
      let found = false;
      for (const scopeFn of this.scopes) {
        if (scopeFn(file)) {
          changed.add(scopeFn);
          found = true;
          break;
        }
      }

      if (!found) {
        noScoped = true;
      }
    }

    // Calculate scoped extensions that didn't change
    const notChanged: ScopeFilter[] = [];

    for (const scopeFn of this.scopes) {
      if (!changed.has(scopeFn)) {
        notChanged.push(scopeFn);
      }
    }

    // Generate the filter function
    return function (entry) {
      // Ignore directories
      if (entry.type === "directory") {
        return true;
      }

      // It matches with any scope that has changed
      for (const scopeFn of changed) {
        if (scopeFn(entry.path)) {
          return true;
        }
      }

      // It's not scoped
      return noScoped && notChanged.every((scopeFn) => !scopeFn(entry.path));
    };
  }
}

export type ScopeFilter = (path: string) => boolean;
