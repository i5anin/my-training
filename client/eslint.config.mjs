import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'
import globals from 'globals'

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      // сгенерированные shadcn-vue примитивы — не наш код
      'src/components/ui/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  {
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser },
    },
  },
  {
    rules: {
      // Жёсткий предел: компонент/модуль не длиннее 350 строк
      // (пустые строки и комментарии не считаются)
      'max-lines': ['error', { max: 350, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ['**/*.vue'],
    rules: {
      // Нативные подсказки браузера запрещены: серые, с задержкой,
      // не стилизуются и не работают на тач-устройствах.
      // Вместо них — компонент Tooltip (@/components/ui/tooltip)
      'vue/no-restricted-static-attribute': ['error', {
        key: 'title',
        message: 'Нативный title запрещён — оберните элемент в Tooltip/TooltipTrigger.',
      }],
      'vue/no-restricted-v-bind': ['error', {
        argument: 'title',
        message: 'Нативный :title запрещён — оберните элемент в Tooltip/TooltipTrigger.',
      }],
    },
  },
)
