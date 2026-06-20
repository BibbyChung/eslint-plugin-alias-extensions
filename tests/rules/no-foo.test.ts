import { TSESLint } from "@typescript-eslint/utils";
import rule from "../../src/rules/no-foo.js";

const ruleTester = new TSESLint.RuleTester();

ruleTester.run("no-foo", rule, {
  valid: ["const bar = 1;", "obj.foo;"],
  invalid: [
    {
      code: "const foo = 1;",
      errors: [{ messageId: "avoidName", data: { name: "foo" } }],
    },
  ],
});
