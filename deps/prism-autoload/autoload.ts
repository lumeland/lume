// deno-lint-ignore-file no-explicit-any
import Prism, { languagesPath } from "../prism.ts";

export default function () {
  const lang_dependencies: Record<string, string | string[]> = {
    "javascript": "clike",
    "actionscript": "javascript",
    "apex": [
      "clike",
      "sql",
    ],
    "arduino": "cpp",
    "aspnet": [
      "markup",
      "csharp",
    ],
    "birb": "clike",
    "bison": "c",
    "c": "clike",
    "csharp": "clike",
    "cpp": "c",
    "cfscript": "clike",
    "chaiscript": [
      "clike",
      "cpp",
    ],
    "cilkc": "c",
    "cilkcpp": "cpp",
    "coffeescript": "javascript",
    "crystal": "ruby",
    "css-extras": "css",
    "d": "clike",
    "dart": "clike",
    "django": "markup-templating",
    "ejs": [
      "javascript",
      "markup-templating",
    ],
    "etlua": [
      "lua",
      "markup-templating",
    ],
    "erb": [
      "ruby",
      "markup-templating",
    ],
    "fsharp": "clike",
    "firestore-security-rules": "clike",
    "flow": "javascript",
    "ftl": "markup-templating",
    "gml": "clike",
    "glsl": "c",
    "go": "clike",
    "gradle": "clike",
    "groovy": "clike",
    "haml": "ruby",
    "handlebars": "markup-templating",
    "haxe": "clike",
    "hlsl": "c",
    "idris": "haskell",
    "java": "clike",
    "javadoc": [
      "markup",
      "java",
      "javadoclike",
    ],
    "jolie": "clike",
    "jsdoc": [
      "javascript",
      "javadoclike",
      "typescript",
    ],
    "js-extras": "javascript",
    "json5": "json",
    "jsonp": "json",
    "js-templates": "javascript",
    "kotlin": "clike",
    "latte": [
      "clike",
      "markup-templating",
      "php",
    ],
    "less": "css",
    "lilypond": "scheme",
    "liquid": "markup-templating",
    "markdown": "markup",
    "markup-templating": "markup",
    "mongodb": "javascript",
    "n4js": "javascript",
    "objectivec": "c",
    "opencl": "c",
    "parser": "markup",
    "php": "markup-templating",
    "phpdoc": [
      "php",
      "javadoclike",
    ],
    "php-extras": "php",
    "plsql": "sql",
    "processing": "clike",
    "protobuf": "clike",
    "pug": [
      "markup",
      "javascript",
    ],
    "purebasic": "clike",
    "purescript": "haskell",
    "qsharp": "clike",
    "qml": "javascript",
    "qore": "clike",
    "racket": "scheme",
    "cshtml": [
      "markup",
      "csharp",
    ],
    "jsx": [
      "markup",
      "javascript",
    ],
    "tsx": [
      "jsx",
      "typescript",
    ],
    "reason": "clike",
    "ruby": "clike",
    "sass": "css",
    "scss": "css",
    "scala": "java",
    "shell-session": "bash",
    "smarty": "markup-templating",
    "solidity": "clike",
    "soy": "markup-templating",
    "sparql": "turtle",
    "sqf": "clike",
    "squirrel": "clike",
    "stata": [
      "mata",
      "java",
      "python",
    ],
    "t4-cs": [
      "t4-templating",
      "csharp",
    ],
    "t4-vb": [
      "t4-templating",
      "vbnet",
    ],
    "tap": "yaml",
    "tt2": [
      "clike",
      "markup-templating",
    ],
    "textile": "markup",
    "twig": "markup-templating",
    "typescript": "javascript",
    "v": "clike",
    "vala": "clike",
    "vbnet": "basic",
    "velocity": "markup",
    "wiki": "markup",
    "xeora": "markup",
    "xml-doc": "markup",
    "xquery": "markup",
  };

  const lang_aliases: Record<string, string> = {
    "html": "markup",
    "xml": "markup",
    "svg": "markup",
    "mathml": "markup",
    "ssml": "markup",
    "atom": "markup",
    "rss": "markup",
    "js": "javascript",
    "g4": "antlr4",
    "ino": "arduino",
    "arm-asm": "armasm",
    "art": "arturo",
    "adoc": "asciidoc",
    "avs": "avisynth",
    "avdl": "avro-idl",
    "gawk": "awk",
    "sh": "bash",
    "shell": "bash",
    "shortcode": "bbcode",
    "rbnf": "bnf",
    "oscript": "bsl",
    "cs": "csharp",
    "dotnet": "csharp",
    "cfc": "cfscript",
    "cilk-c": "cilkc",
    "cilk-cpp": "cilkcpp",
    "cilk": "cilkcpp",
    "coffee": "coffeescript",
    "conc": "concurnas",
    "jinja2": "django",
    "dns-zone": "dns-zone-file",
    "dockerfile": "docker",
    "gv": "dot",
    "eta": "ejs",
    "xlsx": "excel-formula",
    "xls": "excel-formula",
    "gamemakerlanguage": "gml",
    "po": "gettext",
    "gni": "gn",
    "ld": "linker-script",
    "go-mod": "go-module",
    "hbs": "handlebars",
    "mustache": "handlebars",
    "hs": "haskell",
    "idr": "idris",
    "gitignore": "ignore",
    "hgignore": "ignore",
    "npmignore": "ignore",
    "webmanifest": "json",
    "kt": "kotlin",
    "kts": "kotlin",
    "kum": "kumir",
    "tex": "latex",
    "context": "latex",
    "ly": "lilypond",
    "emacs": "lisp",
    "elisp": "lisp",
    "emacs-lisp": "lisp",
    "md": "markdown",
    "moon": "moonscript",
    "n4jsd": "n4js",
    "nani": "naniscript",
    "objc": "objectivec",
    "qasm": "openqasm",
    "objectpascal": "pascal",
    "px": "pcaxis",
    "pcode": "peoplecode",
    "plantuml": "plant-uml",
    "pq": "powerquery",
    "mscript": "powerquery",
    "pbfasm": "purebasic",
    "purs": "purescript",
    "py": "python",
    "qs": "qsharp",
    "rkt": "racket",
    "razor": "cshtml",
    "rpy": "renpy",
    "res": "rescript",
    "robot": "robotframework",
    "rb": "ruby",
    "sh-session": "shell-session",
    "shellsession": "shell-session",
    "smlnj": "sml",
    "sol": "solidity",
    "sln": "solution-file",
    "rq": "sparql",
    "sclang": "supercollider",
    "t4": "t4-cs",
    "trickle": "tremor",
    "troy": "tremor",
    "trig": "turtle",
    "ts": "typescript",
    "tsconfig": "typoscript",
    "uscript": "unrealscript",
    "uc": "unrealscript",
    "url": "uri",
    "vb": "visual-basic",
    "vba": "visual-basic",
    "webidl": "web-idl",
    "mathematica": "wolfram",
    "nb": "wolfram",
    "wl": "wolfram",
    "xeoracube": "xeora",
    "yml": "yaml",
  };

  const lang_data: Record<string, any> = {};
  const ignored_language = "none";
  const languages_path = "components/";
  Prism.plugins.autoloader = {
    languages_path: languages_path,
    use_minified: true,
    loadLanguages: loadLanguages,
  };

  /**
   * Lazily loads an external script.
   */
  function addScript(src: string, success: any, error: any) {
    import(src).then(success).catch(error);
  }

  /**
   * Returns all additional dependencies of the given element defined by the `data-dependencies` attribute.
   */
  function getDependencies(element: HTMLElement): string[] {
    let deps = (element.getAttribute("data-dependencies") || "").trim();

    if (!deps) {
      const parent = element.parentElement;

      if (parent && parent.tagName.toLowerCase() === "pre") {
        deps = (parent.getAttribute("data-dependencies") || "").trim();
      }
    }

    return deps ? deps.split(/\s*,\s*/g) : [];
  }

  /**
   * Returns whether the given language is currently loaded.
   */
  function isLoaded(lang: string): boolean {
    if (lang.indexOf("!") >= 0) {
      // forced reload

      return false;
    }

    lang = lang_aliases[lang] || lang; // resolve alias

    if (lang in Prism.languages) {
      // the given language is already loaded

      return true;
    }

    // this will catch extensions like CSS extras that don't add a grammar to Prism.languages

    const data = lang_data[lang];

    return data && !data.error && data.loading === false;
  }

  /**
   * Returns the path to a grammar, using the language_path and use_minified config keys.
   */
  function getLanguagePath(lang: string): string {
    return `${languagesPath}prism-${lang}.js`;
  }

  /**
   * Loads all given grammars concurrently.
   */
  function loadLanguages(
    languages: string | string[],
    success: any,
    error?: any,
  ) {
    if (typeof languages === "string") {
      languages = [languages];
    }

    const total = languages.length;

    let completed = 0;

    let failed = false;

    if (total === 0) {
      if (success) {
        setTimeout(success, 0);
      }

      return;
    }

    function successCallback() {
      if (failed) {
        return;
      }

      completed++;

      if (completed === total) {
        success && success(languages);
      }
    }

    languages.forEach(function (lang) {
      loadLanguage(lang, successCallback, function () {
        if (failed) {
          return;
        }

        failed = true;

        error && error(lang);
      });
    });
  }

  /**
   * Loads a grammar with its dependencies.
   */
  function loadLanguage(lang: string, success: any, error: any) {
    const force = lang.indexOf("!") >= 0;

    lang = lang.replace("!", "");

    lang = lang_aliases[lang] || lang;

    function load() {
      let data = lang_data[lang];

      if (!data) {
        data = lang_data[lang] = {
          callbacks: [],
        };
      }

      data.callbacks.push({
        success: success,
        error: error,
      });

      if (!force && isLoaded(lang)) {
        // the language is already loaded and we aren't forced to reload

        languageCallback(lang, "success");
      } else if (!force && data.error) {
        // the language failed to load before and we don't reload

        languageCallback(lang, "error");
      } else if (force || !data.loading) {
        // the language isn't currently loading and/or we are forced to reload

        data.loading = true;

        data.error = false;

        addScript(getLanguagePath(lang), function () {
          data.loading = false;

          languageCallback(lang, "success");
        }, function () {
          data.loading = false;

          data.error = true;

          languageCallback(lang, "error");
        });
      }
    }

    const dependencies = lang_dependencies[lang];

    if (dependencies && dependencies.length) {
      loadLanguages(dependencies, load, error);
    } else {
      load();
    }
  }

  /**
   * Runs all callbacks of the given type for the given language.
   */
  function languageCallback(lang: string, type: string) {
    if (lang_data[lang]) {
      const callbacks = lang_data[lang].callbacks;

      for (let i = 0, l = callbacks.length; i < l; i++) {
        const callback = callbacks[i][type];

        if (callback) {
          setTimeout(callback, 0);
        }
      }

      callbacks.length = 0;
    }
  }

  Prism.hooks.add("complete", function (env: any) {
    const element = env.element;

    const language = env.language;

    if (!element || !language || language === ignored_language) {
      return;
    }

    const deps = getDependencies(element);

    if (/^diff-./i.test(language)) {
      // the "diff-xxxx" format is used by the Diff Highlight plugin

      deps.push("diff");

      deps.push(language.substr("diff-".length));
    } else {
      deps.push(language);
    }

    if (!deps.every(isLoaded)) {
      // the language or some dependencies aren't loaded

      loadLanguages(deps, function () {
        Prism.highlightElement(element);
      });
    }
  });
}
