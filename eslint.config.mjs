import nextPlugin from "@next/eslint-plugin-next";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
  {
    plugins: {
      "@next/next": nextPlugin,
      "@typescript-eslint": tsPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
  {
    // The Capacitor native projects are Gradle/Xcode output, not web source.
    // Linting them surfaced warnings from generated bridge files.
    ignores: [
      ".next/*",
      "node_modules/*",
      "android/*",
      "ios/*",
      "build-artifacts/*",
      "public/sw.js",
    ],
  },
];
