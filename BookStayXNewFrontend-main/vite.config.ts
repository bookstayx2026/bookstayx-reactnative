// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Local clones need this so /__l5e/assets-v1/* image URLs proxy to Lovable.
// Override via LOVABLE_PREVIEW_HOST or .env.local if the preview host changes.
if (!process.env.LOVABLE_PREVIEW_HOST?.trim()) {
  process.env.LOVABLE_PREVIEW_HOST =
    "id-preview--53ca259a-1d5c-47fe-b39e-41f00b2ff086.lovable.app";
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Pin Nitro to Vercel so Git→Vercel builds emit the correct Function output
  // (Lovable's default is cloudflare-module).
  nitro: {
    preset: "vercel",
  },
});
