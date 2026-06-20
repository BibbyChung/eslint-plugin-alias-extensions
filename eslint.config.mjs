// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import plugin from "./dist/index.js";

export default tseslint.config(
  { ignores: ["dist/", "node_modules/", "coverage/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    plugins: {
      "alias-extensions": plugin,
    },
  },
);
