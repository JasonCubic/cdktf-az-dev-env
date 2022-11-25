module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'airbnb-base',
    'airbnb-typescript/base',
  ],
  parserOptions: {
    project: './tsconfig.json',
    ecmaVersion: 2020,
  },
  rules: {
    'no-console': 'off',
    'linebreak-style': 'off',
    'max-len': ['warn', { code: 175 }],

    // for cdktf
    'no-new': 'off',
    'no-template-curly-in-string': 'off',
  },
};
