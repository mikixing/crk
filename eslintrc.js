module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.json',
    createDefaultProgram: true,
  },

  extends: [
    'plugin:@typescript-eslint/recommended',
    'prettier/@typescript-eslint',
    'plugin:prettier/recommended',
  ],

  rules: {
    '@typescript-eslint/restrict-template-expressions': 0,
    '@typescript-eslint/explicit-function-return-type': 0,
    '@typescript-eslint/strict-boolean-expressions': 0,
    '@typescript-eslint/naming-convention': 0,
    '@typescript-eslint/no-redeclare': 0,
    '@typescript-eslint/explicit-module-boundary-types': 0,
    '@typescript-eslint/no-extra-semi': 2,
    '@typescript-eslint/no-explicit-any': 0,
    '@typescript-eslint/ban-types': 0,
    '@typescript-eslint/consistent-type-assertions': 0,
    '@typescript-eslint/prefer-readonly': 0,
    '@typescript-eslint/promise-function-async': 0,
    '@typescript-eslint/restrict-plus-operands': 0,
    '@typescript-eslint/no-floating-promises': 0,
    '@typescript-eslint/no-dynamic-delete': 0,
    '@typescript-eslint/no-implied-eval': 0,
    '@typescript-eslint/no-misused-promises': 0,
    '@typescript-eslint/prefer-includes': 0,
    '@typescript-eslint/prefer-as-const': 2,
    '@typescript-eslint/no-unused-vars': 0,

    'one-var': 0,
    'no-cond-assign': 0,
    'no-new-func': 0,
    'promise/param-names': 0,
    'no-unused-vars': 0,
    'prefer-const': [
      2,
      {
        destructuring: 'all',
        ignoreReadBeforeAssign: false,
      },
    ],
    'no-console': 2,
  },
}
