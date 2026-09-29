// A config base já inclui TanStack Start, React, Tailwind, tsconfig-paths e Nitro.
// Não adicione esses plugins manualmente (duplicaria).
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Usa src/server.ts como entrada do servidor (wrapper de erros SSR).
    server: { entry: "server" },
  },
  // O alvo padrão é Cloudflare; aqui trocamos para a Vercel.
  nitro: { preset: "vercel" },
});
