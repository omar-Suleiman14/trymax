const js = require('@eslint/js');
const globals = require('globals');
module.exports = [js.configs.recommended, {
  files: ['**/*.js', '**/*.cjs'],
  languageOptions: { globals: { ...globals.browser, ...globals.node } },
}];
