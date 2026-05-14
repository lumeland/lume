export { posix, sep as SEPARATOR } from "node:path";
export { dirname, join, relative, extname, basename } from "node:path";
export { globToRegExp } from "jsr:@std/path@1.1.4/glob-to-regexp";
export {
  pathToFileURL as toFileUrl,
  fileURLToPath as fromFileUrl,
} from "node:url"

// posix.dirname
// posix.join
// posix.basename
// posix.extname
// posix.normalize
// posix.relative
// posix.resolve
