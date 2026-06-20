// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import plugin from "@dev-bb/eslint-plugin-alias-extensions";

export default tseslint.config(
  { ignores: ["dist/", "node_modules/", "coverage/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    plugins: {
      "alias-extensions": plugin,
    },
    rules: {
      "alias-extensions/require-alias-extension": ["error", {
        mappings: [{ alias: "#src", target: "src" }],
      }],
    },
  },
);
