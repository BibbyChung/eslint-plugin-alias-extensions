import { TSESLint } from "@typescript-eslint/utils";
import noFoo from "./rules/no-foo.js";

const plugin = {
  meta: {
    name: "@dev-bb/eslint-plugin-alias-extensions",
    version: "0.1.0",
    namespace: "alias-extensions",
  },
  configs: {} as Record<string, TSESLint.FlatConfig.ConfigArray>,
  rules: {
    "no-foo": noFoo,
  },
} satisfies TSESLint.FlatConfig.Plugin;

plugin.configs.recommended = [
  {
    name: "alias-extensions/recommended",
    plugins: {
      "alias-extensions": plugin,
    },
    rules: {
      "alias-extensions/no-foo": "off",
    },
  },
];

export default plugin;
