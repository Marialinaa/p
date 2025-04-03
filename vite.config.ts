import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    // Adicionar dependências que podem conter importações dinâmicas
    include: ['@ionic/core', '@ionic/angular'],
    // Desativar o aviso para os arquivos que contêm importações dinâmicas
    esbuildOptions: {
      logOverride: {
        'dynamic-import-with-non-literal-value': 'silent'
      }
    }
  },
  resolve: {
    dedupe: ['@ionic/core', '@ionic/angular']
  }
});
