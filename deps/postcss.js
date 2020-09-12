import postcss from "https://dev.jspm.io/postcss";
import postcssPresetEnv from "https://dev.jspm.io/postcss-preset-env";

const processor = postcss([
  postcssPresetEnv({
    stage: 1,
    features: {
      "custom-properties": false,
    },
  }),
]);

export default processor;
