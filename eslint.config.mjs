import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const DESIGN_TOKEN_PATTERNS = [
  [String.raw`(?<![\w-])text-\[\d[\d.]*(px|rem|em)\]`, 'произвольный кегль — используйте text-body, text-label, text-title…'],
  [String.raw`(?<![\w-])(rounded(-[a-z]{1,2})?|shadow|tracking|leading)-\[`, 'произвольное скругление/тень/трекинг — используйте токен'],
  [String.raw`(?<![\w-])-?(p[xytblrse]?|m[xytblrse]?|gap(-[xy])?|space-[xy])-\[`, 'произвольный отступ — используйте шаг шкалы'],
  [String.raw`(?<![\w-])text-(xs|sm|base|lg|[2-9]?xl)(?![\w-])`, 'стоковый кегль — его нет, используйте токен'],
  [String.raw`(?<![\w-])transition-all(?![\w-])`, 'transition-all — перечислите свойства'],
  [String.raw`(?<![\w-])duration-\d`, 'длительность числом — используйте duration-fast/base/slow'],
]

const DESIGN_TOKEN_RULES = DESIGN_TOKEN_PATTERNS.flatMap(([re, message]) => [
  { selector: `Literal[value=/${re}/]`, message: `Дизайн-система: ${message}` },
  { selector: `TemplateElement[value.raw=/${re}/]`, message: `Дизайн-система: ${message}` },
])

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

  // Дизайн-система: только токены (docs/design-system.md). Полный набор
  // правил — в tests/design-tokens.test.cjs; здесь самые частые, чтобы
  // ошибка была видна прямо в редакторе.
  {
    files: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}', 'shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': ['error', ...DESIGN_TOKEN_RULES],
    },
  },
];

export default eslintConfig;
