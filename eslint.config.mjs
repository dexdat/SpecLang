import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "specs/**",
      ".opencode/**",
      "scripts/**",
      "tests/**",
      "docs/**",
      "config/**",
      ".ralph/**",
      // Symlinked spec files with # speclang-header (not valid TS)
      "src/codegen.ts",
      "src/ralph-loop.ts",
      "src/speclang-mcp.ts",
      "src/validation-system.ts",
      "src/validation.ts",
      // Generated files with Python content
      "src/generated/*.spec-impl-*.ts",
      // Dashboard spec-editor with declaration errors
      "src/dashboard/interactions/spec-editor.ts",
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    rules: {
      // Relax rules to get a clean baseline
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
      "no-empty": "off",
      "no-prototype-builtins": "off",
      "no-case-declarations": "off",
      "prefer-const": "off",
      "no-fallthrough": "off",
      "no-redeclare": "off",
      "no-empty-function": "off",
    },
  },
);
