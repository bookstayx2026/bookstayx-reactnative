import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#050709" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BookStayX" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/pwa-192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.__bookstayxInstallPrompt = null;
              window.addEventListener('beforeinstallprompt', function (event) {
                event.preventDefault();
                window.__bookstayxInstallPrompt = event;
                window.dispatchEvent(new Event('bookstayx-install-ready'));
              });
              window.addEventListener('appinstalled', function () {
                window.__bookstayxInstallPrompt = null;
              });
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                  navigator.serviceWorker.register('/sw.js').catch(function () {});
                });
              }
            `,
          }}
        />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: `html, body, #root { min-height: 100%; background: #050709; } body { margin: 0; }` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
