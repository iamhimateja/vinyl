import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'dev-dist', 'dist-electron', 'node_modules']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Allow setState in effects for initialization patterns (common in React)
      'react-hooks/set-state-in-effect': 'off',
      // Allow reading refs during render (needed for derived values from refs)
      'react-hooks/refs': 'off',
      // Allow impure functions like Date.now() in refs (common pattern)
      'react-hooks/purity': 'off',
      // Allow hoisted function access (common JS pattern)
      'react-hooks/immutability': 'off',
      // Warn instead of error for exhaustive deps (sometimes intentional)
      'react-hooks/exhaustive-deps': 'warn',
      // Disable React Compiler memoization preservation (advanced optimization)
      'react-hooks/preserve-manual-memoization': 'off',
      // Allow exporting helpers alongside components
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Allow unused variables that start with underscore (intentionally unused)
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
    },
  },
])
