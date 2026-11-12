import React, { createContext, useContext, useState, useEffect } from 'react';
import { offlineCacheManager, CacheStats, OfflineAction } from '../services/offlineCache';
import { store } from '../services/store';

interface OfflineContextType {
  isOnline: boolean;
  isRealOnline: boolean;
  isSimulatedOffline: boolean;
  setSimulatedOffline: (val: boolean) => void;
  cacheStats: CacheStats;
  syncCacheNow: () => Promise<void>;
  isSyncing: boolean;
  pendingActions: OfflineAction[];
  flushQueue: () => void;
  showSyncModal: boolean;
  setShowSyncModal: (val: boolean) => void;
  lastSyncFormatted: string;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [realOnline, setRealOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  const [simulatedOffline, setSimulatedOfflineState] = useState<boolean>(() => {
    return offlineCacheManager.isSimulatedOffline();
  });

  const [cacheStats, setCacheStats] = useState<CacheStats>(() => {
    return offlineCacheManager.getCacheStats();
  });

  const [pendingActions, setPendingActions] = useState<OfflineAction[]>(() => {
    return offlineCacheManager.getPendingQueue();
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);

  // Écoute des événements réseau natifs
  useEffect(() => {
    const handleOnline = () => setRealOnline(true);
    const handleOffline = () => setRealOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Écoute des modifications du store pour mettre à jour automatiquement le snapshot
    const unsubStore = store.subscribe(() => {
      offlineCacheManager.saveFullSnapshot();
      setCacheStats(offlineCacheManager.getCacheStats());
    });

    // Écoute des modifications du gestionnaire de cache
    const unsubCache = offlineCacheManager.subscribe(() => {
      setCacheStats(offlineCacheManager.getCacheStats());
      setPendingActions(offlineCacheManager.getPendingQueue());
      setSimulatedOfflineState(offlineCacheManager.isSimulatedOffline());
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubStore();
      unsubCache();
    };
  }, []);

  const isOnline = realOnline && !simulatedOffline;

  const setSimulatedOffline = (enabled: boolean) => {
    offlineCacheManager.setSimulatedOffline(enabled);
    setSimulatedOfflineState(enabled);
  };

  const syncCacheNow = async () => {
    setIsSyncing(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    offlineCacheManager.saveFullSnapshot();
    offlineCacheManager.flushPendingQueue();
    setIsSyncing(false);
  };

  const flushQueue = () => {
    offlineCacheManager.flushPendingQueue();
  };

  const lastSyncDate = new Date(cacheStats.lastSyncTimestamp);
  const lastSyncFormatted = lastSyncDate.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isRealOnline: realOnline,
        isSimulatedOffline: simulatedOffline,
        setSimulatedOffline,
        cacheStats,
        syncCacheNow,
        isSyncing,
        pendingActions,
        flushQueue,
        showSyncModal,
        setShowSyncModal,
        lastSyncFormatted,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = (): OfflineContextType => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline doit être utilisé dans un OfflineProvider');
  }
  return context;
};
