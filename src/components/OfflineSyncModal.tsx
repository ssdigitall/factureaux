import React from 'react';
import {
  X,
  Wifi,
  WifiOff,
  Database,
  RefreshCw,
  CheckCircle2,
  HardDrive,
  Clock,
  Layers,
  Users,
  Droplets,
  Receipt,
  Wallet,
  Gauge,
  Sliders,
  ShieldCheck,
} from 'lucide-react';
import { useOffline } from '../context/OfflineContext';

export const OfflineSyncModal: React.FC = () => {
  const {
    showSyncModal,
    setShowSyncModal,
    isOnline,
    isRealOnline,
    isSimulatedOffline,
    setSimulatedOffline,
    cacheStats,
    syncCacheNow,
    isSyncing,
    pendingActions,
    lastSyncFormatted,
  } = useOffline();

  if (!showSyncModal) return null;

  const cacheSizeKb = Math.round(cacheStats.cacheSizeBytes / 1024);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => setShowSyncModal(false)}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#082F49] dark:text-sky-300">
              Gestionnaire de Cache & Mode Hors-Ligne
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mise en cache locale pour zones à connexion instable (Sénégal & Afrique de l'Ouest)
            </p>
          </div>
        </div>

        {/* Connectivity Status Banner */}
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 mb-5 ${
            isOnline
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {isOnline ? (
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Wifi className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <WifiOff className="w-4 h-4" />
              </div>
            )}
            <div>
              <div className="text-xs font-bold">
                {isOnline ? 'Connexion Internet Établie' : 'Mode Hors-Ligne Actif'}
              </div>
              <div className="text-[11px] opacity-80">
                {isOnline
                  ? 'Toutes les données sont synchronisées avec le serveur.'
                  : 'Les données de base restent consultables grâce au cache local.'}
              </div>
            </div>
          </div>

          <button
            onClick={syncCacheNow}
            disabled={isSyncing}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Synchronisation...' : 'Actualiser'}</span>
          </button>
        </div>

        {/* Offline Simulation Switch */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 mb-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-500" />
              <span>Simulateur de coupure internet</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Permet de tester la navigation et la consultation sans couper votre réseau.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isSimulatedOffline}
              onChange={(e) => setSimulatedOffline(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-amber-600"></div>
          </label>
        </div>

        {/* Cached Entities Summary */}
        <div className="mb-5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
            <span>Données de base stockées localement :</span>
            <span className="font-mono text-[11px] text-cyan-600 dark:text-cyan-400 font-normal">
              Taille: ~{cacheSizeKb} Ko
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                <Droplets className="w-3.5 h-3.5 text-cyan-500" />
                <span>Forages</span>
              </div>
              <div className="text-base font-bold font-mono text-[#082F49] dark:text-sky-300 mt-1">
                {cacheStats.foragesCount}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                <Users className="w-3.5 h-3.5 text-sky-500" />
                <span>Abonnés</span>
              </div>
              <div className="text-base font-bold font-mono text-[#082F49] dark:text-sky-300 mt-1">
                {cacheStats.abonnesCount}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                <Gauge className="w-3.5 h-3.5 text-indigo-500" />
                <span>Compteurs</span>
              </div>
              <div className="text-base font-bold font-mono text-[#082F49] dark:text-sky-300 mt-1">
                {cacheStats.compteursCount}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                <Receipt className="w-3.5 h-3.5 text-amber-500" />
                <span>Factures</span>
              </div>
              <div className="text-base font-bold font-mono text-[#082F49] dark:text-sky-300 mt-1">
                {cacheStats.facturesCount}
              </div>
            </div>
          </div>
        </div>

        {/* Sync Metadata & Info */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1.5 border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <span>Dernière mise en cache locale :</span>
            <strong className="font-mono text-slate-800 dark:text-slate-200">{lastSyncFormatted}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span>Service Worker PWA :</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Actif (/sw.js)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Actions hors-ligne en attente :</span>
            <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
              {pendingActions.length} opération(s)
            </span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 text-xs">
          <button
            onClick={() => setShowSyncModal(false)}
            className="px-4 py-2 rounded-xl bg-[#082F49] dark:bg-sky-600 text-white font-bold transition hover:bg-sky-900 dark:hover:bg-sky-500 cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
