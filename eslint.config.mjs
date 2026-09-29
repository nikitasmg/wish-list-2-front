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

  // Заимствованные компоненты: WebGL-шейдеры и обёртка над градиентной
  // рамкой пришли из внешней библиотеки целиком. Переписывать их типы ради
  // чистого прогона незачем — правок в них не бывает, а `pnpm lint` должен
  // оставаться зелёным, чтобы в нём было видно настоящие ошибки.
  {
    files: ['components/ui/splash-cursor.tsx', 'components/ui/star-border.tsx'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },

  // actionTypes нужен только как источник типа (`typeof actionTypes`), и
  // правило этого не видит. Файл из шаблона shadcn.
  {
    files: ['hooks/use-toast.ts'],
    rules: { '@typescript-eslint/no-unused-vars': 'off' },
  },
];

export default eslintConfig;
