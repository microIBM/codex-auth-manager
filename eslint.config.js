import js from "@eslint/js";
import vue from "eslint-plugin-vue";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import vueParser from "vue-eslint-parser";

export default [
  {
    ignores: [
      "auth/**",
      "bundle/**",
      "data/**",
      "dist/**",
      "hotmail/**",
      "node_modules/**",
      "web/dist/**",
    ],
  },
  js.configs.recommended,
  ...vue.configs["flat/recommended"],
  {
    files: ["src/**/*.ts", "web/src/**/*.ts", "scripts/**/*.mjs", "*.config.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: "module",
      },
      globals: {
        Buffer: "readonly",
        Headers: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        clearInterval: "readonly",
        clearTimeout: "readonly",
        console: "readonly",
        fetch: "readonly",
        process: "readonly",
        setInterval: "readonly",
        setTimeout: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
  },
  {
    files: ["web/src/**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: [".vue"],
        sourceType: "module",
      },
      globals: {
        EventSource: "readonly",
        HTMLElement: "readonly",
        URLSearchParams: "readonly",
        document: "readonly",
        localStorage: "readonly",
        window: "readonly",
      },
    },
    rules: {
      "vue/html-indent": ["error", 2],
      "vue/script-indent": ["error", 2, {"baseIndent": 0}],
    },
  },
  {
    files: ["src/**/*.ts", "web/src/**/*.{ts,vue}", "scripts/**/*.mjs", "*.config.ts"],
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      indent: ["error", 2, {"SwitchCase": 1}],
      "no-console": "off",
      "no-constant-binary-expression": "off",
      "no-control-regex": "off",
      "no-useless-assignment": "off",
      "preserve-caught-error": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unused-vars": ["warn", {"argsIgnorePattern": "^_", "varsIgnorePattern": "^_"}],
      "vue/multi-word-component-names": "off",
      "vue/max-attributes-per-line": "off",
      "vue/html-self-closing": "off",
      "vue/singleline-html-element-content-newline": "off",
      "vue/html-closing-bracket-newline": "off",
      "vue/html-indent": ["error", 2],
    },
  },
];
