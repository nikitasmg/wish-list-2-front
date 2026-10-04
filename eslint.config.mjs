import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  { ignores: ['.next/**', 'node_modules/**', '.pnpm-store/**', '.worktrees/**', '.codex/**', 'out/**'] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  { files: ['tests/**/*.cjs'], rules: { '@typescript-eslint/no-require-imports': 'off' } },

  // actionTypes нужен только как источник типа (`typeof actionTypes`), и
  // правило этого не видит. Файл из шаблона shadcn.
  {
    files: ['hooks/use-toast.ts'],
    rules: { '@typescript-eslint/no-unused-vars': 'off' },
  },
];

export default eslintConfig;
