import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

type InstallChoice = { outcome: "accepted" | "dismissed"; platform: string };
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallChoice>;
};

declare global {
  interface Navigator {
    standalone?: boolean;
  }
  interface Window {
    __bookstayxInstallPrompt?: InstallPromptEvent | null;
  }
}

export function usePwaInstall() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() =>
    Platform.OS === "web" && typeof window !== "undefined"
      ? window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true
      : false,
  );

  useEffect(() => {
    if (Platform.OS !== "web") return;

    const capturePrompt = (event: Event) => {
      event.preventDefault();
      const prompt = event.type === "bookstayx-install-ready"
        ? window.__bookstayxInstallPrompt
        : event as InstallPromptEvent;
      if (prompt) setPromptEvent(prompt);
    };
    const markInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("bookstayx-install-ready", capturePrompt);
    window.addEventListener("appinstalled", markInstalled);
    if (window.__bookstayxInstallPrompt) setTimeout(() => setPromptEvent(window.__bookstayxInstallPrompt || null), 0);
    return () => {
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("bookstayx-install-ready", capturePrompt);
      window.removeEventListener("appinstalled", markInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (promptEvent) {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === "accepted") {
        setPromptEvent(null);
        window.__bookstayxInstallPrompt = null;
      }
      return;
    }

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    window.alert(
      isIos
        ? "To install BookStayX, tap Share and then Add to Home Screen."
        : "Open this site in Chrome or Edge and choose Install app from the browser menu.",
    );
  }, [promptEvent]);

  return {
    canShow: Platform.OS === "web" && !installed,
    install,
  };
}
