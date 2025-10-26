import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/',
  envDir: './',
  envPrefix: 'VITE_',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        atleta_dashboard: resolve(__dirname, 'templates/atleta/dashboard.html'),
        atleta_solicitar: resolve(__dirname, 'templates/atleta/solicitar.html'), // Adicionado para o formulário de solicitação do atleta
        servico_social_dashboard: resolve(__dirname, 'templates/servico_social/dashboard.html'),
        monitor_dashboard: resolve(__dirname, 'templates/monitor/dashboard.html'),
        supervisor_dashboard: resolve(__dirname, 'templates/supervisor/dashboard.html'),
        primeiro_acesso: resolve(__dirname, 'primeiro-acesso.html'),
        // Adicione aqui todos os outros arquivos HTML que são pontos de entrada
        // Exemplo: 'outro_dashboard': resolve(__dirname, 'templates/outro/dashboard.html'),
      },
    },
    sourcemap: false
  }
})
