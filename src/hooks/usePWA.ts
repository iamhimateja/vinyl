import { useState, useEffect, useCallback } from "react";

// Check if running in a desktop environment - must be done at module level for tree shaking
const isElectron =
  typeof window !== "undefined" &&
  (window as { electron?: { isElectron?: boolean } }).electron?.isElectron ===
    true;
const isTauri = typeof window !== "undefined" && "__TAURI__" in window;
const isDesktopApp = isElectron || isTauri;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function usePWA() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(isDesktopApp); // Consider desktop apps as "installed"
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [isReady, setIsReady] = useState(isDesktopApp); // Desktop apps are always ready
  const [updateServiceWorker, setUpdateServiceWorker] = useState<
    ((reloadPage?: boolean) => Promise<void>) | null
  >(null);

  // Register service worker only in web browser (not in desktop apps)
  useEffect(() => {
    // Skip PWA registration entirely in desktop apps
    if (isDesktopApp) {
      return;
    }

    // Dynamic import to avoid loading PWA code in Tauri
    import("virtual:pwa-register")
      .then(({ registerSW }) => {
        const updateSW = registerSW({
          immediate: true,
          onNeedRefresh() {
            setNeedRefresh(true);
          },
          onOfflineReady() {
            setOfflineReady(true);
          },
          onRegistered(registration) {
            if (registration) {
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
            console.error("[PWA] Service worker registration error:", error);
          },
        });
        setUpdateServiceWorker(() => updateSW);
      })
      .catch((error) => {
        console.warn("[PWA] Failed to load service worker module:", error);
      });
  }, []);

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
    // Skip in desktop apps
    if (isDesktopApp) return;

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
    if (updateServiceWorker) {
      updateServiceWorker(true);
    }
    setNeedRefresh(false);
  }, [updateServiceWorker]);

  const dismissOfflineReady = useCallback(() => {
    setOfflineReady(false);
  }, []);

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
