import { useState, useEffect, useCallback } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

// Check if running in Tauri
const isTauri = "__TAURI__" in window;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function usePWA() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(isTauri); // Consider Tauri as "installed"
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isReady, setIsReady] = useState(isTauri); // Tauri is always ready

  // Use vite-plugin-pwa's hook for service worker registration
  // Only register in web browser, not in Tauri
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: !isTauri, // Don't register immediately in Tauri
    onRegistered(registration) {
      if (registration && !isTauri) {
        setIsReady(true);
        // Check for updates periodically (every hour)
        setInterval(
          () => {
            registration.update();
          },
          60 * 60 * 1000,
        );
      }
    },
    onRegisterError(error) {
      // Only log error in web browser, not in Tauri
      if (!isTauri) {
        console.error("[PWA] Service worker registration error:", error);
      }
    },
  });

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    // Check if already installed
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone ||
      document.referrer.includes("android-app://");

    setIsInstalled(isStandalone);

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!installPrompt) return false;

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;

      if (outcome === "accepted") {
        setInstallPrompt(null);
        return true;
      }
    } catch (error) {
      console.error("Install prompt error:", error);
    }

    return false;
  }, [installPrompt]);

  const updateApp = useCallback(() => {
    updateServiceWorker(true);
    setNeedRefresh(false);
  }, [updateServiceWorker, setNeedRefresh]);

  const dismissOfflineReady = useCallback(() => {
    setOfflineReady(false);
  }, [setOfflineReady]);

  return {
    canInstall: !!installPrompt && !isInstalled,
    isInstalled,
    isOnline,
    isOfflineReady: offlineReady,
    isReady,
    isUpdateAvailable: needRefresh,
    promptInstall,
    updateApp,
    dismissOfflineReady,
  };
}
