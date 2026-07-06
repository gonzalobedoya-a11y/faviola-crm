import base from '@faviola/config/eslint/base';

export default [
  ...base,
  {
    rules: {
      '@typescript-eslint/no-extraneous-class': 'off',
      // NestJS resuelve dependencias por el TIPO del constructor en tiempo de
      // ejecución (emitDecoratorMetadata). Forzar `import type` eliminaría esas
      // referencias y rompería la inyección de dependencias.
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
];
