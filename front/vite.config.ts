import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    // Configuração para permitir acesso via ngrok e outros hosts externos
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '.ngrok-free.app', // Permite qualquer subdomínio do ngrok
      '.ngrok.io', // Permite domínios ngrok.io também
      '.ngrok.app', // Permite domínios ngrok.app
      // Adicione URLs específicas do ngrok aqui se necessário:
      // '9531ca1cb04e.ngrok-free.app',
      // 'abc123.ngrok-free.app',
    ],
    // Configurações adicionais para melhor compatibilidade com ngrok
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5656',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-label'],
        },
      },
    },
  },
  define: {
    // Garantir que as variáveis de ambiente sejam incluídas no build
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL),
    'import.meta.env.VITE_SIGNALR_URL': JSON.stringify(process.env.VITE_SIGNALR_URL),
    'import.meta.env.VITE_CLERK_PUBLISHABLE_KEY': JSON.stringify(process.env.VITE_CLERK_PUBLISHABLE_KEY),
  },
});
