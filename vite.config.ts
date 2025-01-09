import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
//@ts-ignore
import eslintPlugin from "vite-plugin-eslint"; // Add ESLint plugin
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      eslintPlugin({
        failOnWarning: false, // Ignore ESLint warnings
        failOnError: false, // Ignore ESLint errors
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    optimizeDeps: {
      exclude: ["lucide-react"],
    },
    define: {
      "import.meta.env.VITE_GROQ_API_KEY": JSON.stringify(
        env.VITE_GROQ_API_KEY
      ),
    },
  };
});
