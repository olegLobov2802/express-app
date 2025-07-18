module.exports = {
  root: true,
  env: {
    node: true,
    jest: true,
    es2021: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
    ecmaVersion: 'latest',
  },
  plugins: [
    '@typescript-eslint',
    'import',
    'unused-imports', // Добавлен плагин для неиспользуемых импортов
    'prettier',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:prettier/recommended',
  ],
  ignorePatterns: [
    'dist/**',
    'node_modules/**',
    '.eslintrc.js',
  ],
  rules: {
    "@typescript-eslint/no-unsafe-return": "off",
    "@typescript-eslint/ban-types": "off",
    "@typescript-eslint/unbound-method": "off",
    "@typescript-eslint/restrict-plus-operands": "off",
    "@typescript-eslint/no-this-alias": "off",
    "@typescript-eslint/no-empty-interface": "off",
    "@typescript-eslint/require-await": "off",
    // Правила для неиспользуемых импортов
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'error',
      {
        vars: 'all',
        args: 'none',
        ignoreRestSiblings: true,
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],

    // TypeScript правила
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-function-return-type': ['warn'],
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/no-unused-vars': 'off', // Отключаем в пользу unused-imports

    // Импорты
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
          'object',
          'type',
        ],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'import/no-unresolved': 'off',

    // Общие правила
    'no-console': 'warn',
    'prettier/prettier': 'error',
  },
  settings: {
    'import/resolver': {},
  },
};
