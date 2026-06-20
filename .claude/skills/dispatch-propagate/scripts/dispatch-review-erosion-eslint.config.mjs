import tseslint from 'typescript-eslint';
export default [
  { files: ['**/*.{ts,tsx,mts,cts}'], languageOptions: { parser: tseslint.parser }, rules: { complexity: ['error', 0] } },
  { files: ['**/*.{js,jsx,mjs,cjs}'],                                               rules: { complexity: ['error', 0] } },
];
