import postcss from "https://dev.jspm.io/postcss";
import postcssImport from "https://dev.jspm.io/postcss-import";
import postcssUrl from "https://dev.jspm.io/postcss-url";
import postcssPresetEnv from "https://dev.jspm.io/postcss-preset-env";

const processor = postcss([
  postcssImport(),
  postcssUrl(),
  postcssPresetEnv({
    stage: 1,
    features: {
      "custom-properties": false,
    },
  }),
]);

export default processor;
