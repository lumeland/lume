export { posix, sep as SEPARATOR } from "node:path";
export { basename, dirname, extname, join, relative } from "node:path";
export { globToRegExp } from "jsr:@std/path@1.1.6/glob-to-regexp";
export {
  fileURLToPath as fromFileUrl,
  pathToFileURL as toFileUrl,
} from "node:url";

// posix.dirname
// posix.join
// posix.basename
// posix.extname
// posix.normalize
// posix.relative
// posix.resolve
