import React, { useState } from 'react';
import { Download, Smartphone, X, Check, Share2, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Masquer si déjà installé comme PWA autonome
  if (isInstalled) {
    return null;
  }

  // Navigateurs Chromium / Android / Desktop supportant beforeinstallprompt
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-[#0369A1] hover:from-cyan-500 hover:to-sky-600 text-white font-semibold text-xs transition shadow-sm cursor-pointer ${
          compact ? 'px-2 py-1' : 'px-3 py-1.5'
        }`}
        title="Installer l'application FACTUREAU sur votre appareil pour consultation hors-ligne"
        aria-label="Installer l'application"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Installer l'App</span>
      </button>
    );
  }

  // Guide iOS Safari (WebKit ne supporte pas l'invite automatique)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 rounded-xl border border-sky-700/60 bg-sky-950/80 hover:bg-sky-900 text-slate-200 text-xs font-medium transition cursor-pointer ${
            compact ? 'px-2 py-1' : 'px-3 py-1.5'
          }`}
          title="Installer sur iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
          <span>Installer (iOS)</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 relative">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-6 h-6" />
              </div>

              <h3 className="text-base font-bold text-center text-[#082F49] dark:text-sky-300">
                Installer FACTUREAU sur iOS
              </h3>

              <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <Share2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    1. Touchez le bouton <strong>Partager</strong> dans la barre Safari.
                  </span>
                </div>
                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <PlusSquare className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    2. Faites défiler et touchez <strong>Sur l'écran d'accueil</strong>.
                  </span>
                </div>
                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    3. Touchez <strong>Ajouter</strong> pour l'utiliser en plein écran hors-ligne.
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition cursor-pointer"
              >
                Compris
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
