import React from 'react';
import { Wifi, WifiOff, RefreshCw, Database, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useOffline } from '../context/OfflineContext';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, isSimulatedOffline, lastSyncFormatted, setShowSyncModal, syncCacheNow, isSyncing, cacheStats } = useOffline();

  // Si en ligne et pas de simulation, on ne montre pas la bannière flottante d'urgence
  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-md bg-amber-600 dark:bg-amber-700 text-white p-3 sm:px-4 sm:py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 border border-amber-400/50 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-amber-800/80 flex items-center justify-center shrink-0">
          <WifiOff className="w-4 h-4 text-amber-200" />
        </div>
        <div className="min-w-0 text-left">
          <div className="text-xs font-bold flex items-center gap-1.5 truncate">
            <span>Mode Hors-Ligne</span>
            {isSimulatedOffline && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-800 text-amber-100 font-mono">
                SIMULATION
              </span>
            )}
          </div>
          <p className="text-[11px] text-amber-100 truncate">
            Consultation active du cache local ({cacheStats.abonnesCount} abonnés, {cacheStats.foragesCount} forages)
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => setShowSyncModal(true)}
          className="px-2.5 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition cursor-pointer"
        >
          Détails cache
        </button>
        <button
          onClick={syncCacheNow}
          disabled={isSyncing}
          className="p-1.5 rounded-lg bg-white text-amber-800 hover:bg-amber-100 transition cursor-pointer disabled:opacity-50"
          title="Actualiser le cache"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
};
