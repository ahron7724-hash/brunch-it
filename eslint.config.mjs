import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "prefer-template": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-script-url": "error",
      "react/no-danger": "error",
      "react/jsx-no-target-blank": "error",
      "react/jsx-no-script-url": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "no-restricted-properties": [
        "error",
        { property: "innerHTML", message: "אסור – השתמש ב-textContent או JSX" },
        { property: "outerHTML", message: "אסור" },
        { property: "insertAdjacentHTML", message: "אסור" },
        { object: "document", property: "write", message: "אסור" },
      ],
    },
  },
  {
    // Email templates are full HTML documents rendered to a string, not Next.js pages.
    files: ["src/lib/email/**"],
    rules: { "@next/next/no-head-element": "off" },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
