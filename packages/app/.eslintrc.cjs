/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
  root: true,

  env: {
    node: true,
    'vue/setup-compiler-macros': true,
  },

  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'vue/multi-word-component-names': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/consistent-type-imports': 'error',
    'import/order': [
      'error',
      {
        groups: [
          ['builtin', 'external'],
          ['internal'],
          ['sibling', 'parent'],
          'index',
          'object',
          'type',
        ],
        'newlines-between': 'always',
        pathGroups: [
          {
            pattern: 'vue**',
            group: 'builtin',
            position: 'before',
          },
          {
            pattern: 'vite**',
            group: 'builtin',
            position: 'before',
          },
          {
            pattern: '@/components/**',
            group: 'index',
            position: 'before',
          },
          {
            pattern: '@/composables/**',
            group: 'index',
            position: 'before',
          },
          {
            pattern: '*.json',
            group: 'object',
            patternOptions: { matchBase: true },
          },
        ],
        pathGroupsExcludedImportTypes: ['builtin', 'type'],
        alphabetize: {
          order: 'asc',
          caseInsensitive: false,
        },
      },
    ],
    'sort-imports': [
      'error',
      {
        ignoreCase: true,
        ignoreDeclarationSort: true,
      },
    ],
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        args: 'all',
        argsIgnorePattern: '^_',
        caughtErrors: 'all',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
    'vue/no-unused-vars': [
      'error',
      {
        ignorePattern: '^_',
      },
    ],
  },

  plugins: ['import'],

  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/eslint-config-typescript/recommended',
    '@vue/eslint-config-prettier',
    'plugin:import/typescript',
  ],

  globals: {
    BigInt: true,
  },

  overrides: [
    {
      files: [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)',
      ],
      env: {
        jest: true,
      },
    },
  ],
};
