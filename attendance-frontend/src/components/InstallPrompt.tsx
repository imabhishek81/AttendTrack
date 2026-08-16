import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Sparkles, Share2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if already in standalone PWA mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      return; // Already installed as PWA
    }

    // Check if dismissed in this session
    if (sessionStorage.getItem('attendtrack_pwa_dismissed')) {
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      setIsVisible(true);
      return;
    }

    // Native Chrome / Android / Desktop install event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('attendtrack_pwa_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 left-4 sm:left-auto sm:right-6 sm:w-96 z-50 animate-slide-up">
      <div className="glass-card gradient-border p-4 shadow-2xl backdrop-blur-2xl border-indigo-500/20 bg-surface-900/90 relative">
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-3 text-surface-500 hover:text-white transition-colors p-1"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5 pr-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30 ring-1 ring-white/10">
            <Smartphone className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h4 className="text-sm font-bold text-white tracking-tight">Install AttendTrack</h4>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-xs text-surface-400 leading-relaxed mb-3">
              Install as a native app on your phone or desktop for instant 1-tap offline tracking!
            </p>

            {showIOSGuide ? (
              <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-surface-300 mb-2 leading-relaxed">
                <p className="font-semibold text-indigo-300 mb-1 flex items-center gap-1">
                  <Share2 className="w-3.5 h-3.5" /> iOS Instructions:
                </p>
                1. Tap the <strong className="text-white">Share</strong> button in Safari toolbar.
                <br />
                2. Select <strong className="text-white">Add to Home Screen</strong> ⊕.
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              <button
                onClick={handleInstallClick}
                className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isIOS ? 'How to Install' : 'Install App'}</span>
              </button>

              <button
                onClick={handleDismiss}
                className="btn-outline text-xs py-2 px-3 text-surface-400 hover:text-white"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
