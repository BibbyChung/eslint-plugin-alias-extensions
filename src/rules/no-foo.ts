import type { TSESLint } from "@typescript-eslint/utils";

type RuleModule = TSESLint.RuleModule<"avoidName", never[]>;

const rule: RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow variables named 'foo'. (placeholder rule)",
    },
    messages: {
      avoidName: "Avoid using variables named '{{ name }}'.",
    },
    schema: [],
  },
  create(context) {
    return {
      Identifier(node) {
        if (node.name === "foo" && node.parent?.type !== "MemberExpression") {
          context.report({
            node,
            messageId: "avoidName",
            data: { name: node.name },
          });
        }
      },
    };
  },
};

export default rule;
