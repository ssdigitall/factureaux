/**
 * Service de Gestion du Cache Local & Mode Hors-Ligne (FACTUREAU V3.0)
 * Conçu pour les forages et ASUFOR opérant en zones à connectivité internet instable.
 */

import { store } from './store';

const SNAPSHOT_KEY = 'factureau_offline_snapshot_v1';
const PENDING_QUEUE_KEY = 'factureau_offline_pending_queue_v1';
const SIMULATED_OFFLINE_KEY = 'factureau_simulated_offline';
const LAST_SYNC_KEY = 'factureau_last_sync_timestamp';

export interface OfflineAction {
  id: string;
  type: 'RELEVE_COMPTEUR' | 'PAIEMENT' | 'DEPENSE' | 'VENTE_BORNE' | 'PANNE';
  titre: string;
  donnees: any;
  timestamp: string;
  statut: 'EN_ATTENTE' | 'SYNCHRONISE';
}

export interface CacheStats {
  foragesCount: number;
  abonnesCount: number;
  compteursCount: number;
  facturesCount: number;
  comptesCount: number;
  productionCount: number;
  bornesCount: number;
  pannesCount: number;
  lastSyncTimestamp: number;
  cacheSizeBytes: number;
  isReady: boolean;
}

class OfflineCacheManager {
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Initialise le snapshot s'il n'existe pas encore
    if (typeof window !== 'undefined') {
      const existing = localStorage.getItem(SNAPSHOT_KEY);
      if (!existing) {
        this.saveFullSnapshot();
      }
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }

  /**
   * Sauvegarde un instantané complet des entités du store dans localStorage
   */
  public saveFullSnapshot(): void {
    try {
      const snapshot = {
        timestamp: Date.now(),
        dateStr: new Date().toLocaleString('fr-FR'),
        forages: store.getForages(),
        abonnes: store.getAbonnes(),
        compteurs: store.getCompteurs(),
        factures: store.getFactures(),
        comptes: store.getComptes(),
        production: store.getProduction(),
        bornes: store.getBornes(),
        pannes: store.getPannes(),
        currentUser: store.getCurrentUser(),
        currentOrg: store.getCurrentOrganisation(),
      };

      const serialized = JSON.stringify(snapshot);
      localStorage.setItem(SNAPSHOT_KEY, serialized);
      localStorage.setItem(LAST_SYNC_KEY, String(Date.now()));
      this.notify();
    } catch (e) {
      console.error('[Cache Hors-Ligne] Erreur lors de la sauvegarde du snapshot:', e);
    }
  }

  /**
   * Récupère les métriques du cache local
   */
  public getCacheStats(): CacheStats {
    try {
      const raw = localStorage.getItem(SNAPSHOT_KEY);
      const lastSync = Number(localStorage.getItem(LAST_SYNC_KEY) || Date.now());

      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          foragesCount: parsed.forages?.length || 0,
          abonnesCount: parsed.abonnes?.length || 0,
          compteursCount: parsed.compteurs?.length || 0,
          facturesCount: parsed.factures?.length || 0,
          comptesCount: parsed.comptes?.length || 0,
          productionCount: parsed.production?.length || 0,
          bornesCount: parsed.bornes?.length || 0,
          pannesCount: parsed.pannes?.length || 0,
          lastSyncTimestamp: lastSync,
          cacheSizeBytes: new Blob([raw]).size,
          isReady: true,
        };
      }
    } catch (e) {
      console.error('[Cache Hors-Ligne] Erreur lecture stats:', e);
    }

    return {
      foragesCount: store.getForages().length,
      abonnesCount: store.getAbonnes().length,
      compteursCount: store.getCompteurs().length,
      facturesCount: store.getFactures().length,
      comptesCount: store.getComptes().length,
      productionCount: store.getProduction().length,
      bornesCount: store.getBornes().length,
      pannesCount: store.getPannes().length,
      lastSyncTimestamp: Date.now(),
      cacheSizeBytes: 45000,
      isReady: true,
    };
  }

  /**
   * File d'attente d'actions effectuées hors-ligne (ex: relève d'index sans réseau)
   */
  public getPendingQueue(): OfflineAction[] {
    try {
      const raw = localStorage.getItem(PENDING_QUEUE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // Ignorer
    }
    return [];
  }

  public enqueueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'statut'>): OfflineAction {
    const queue = this.getPendingQueue();
    const newAction: OfflineAction = {
      ...action,
      id: `off-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      statut: 'EN_ATTENTE',
    };

    queue.push(newAction);
    localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(queue));
    this.notify();
    return newAction;
  }

  public flushPendingQueue(): { success: boolean; syncedCount: number } {
    const queue = this.getPendingQueue();
    const count = queue.length;
    localStorage.removeItem(PENDING_QUEUE_KEY);
    this.saveFullSnapshot();
    this.notify();
    return { success: true, syncedCount: count };
  }

  /**
   * Mode hors-ligne simulé (permet de tester l'UI sans débrancher le Wi-Fi)
   */
  public isSimulatedOffline(): boolean {
    return localStorage.getItem(SIMULATED_OFFLINE_KEY) === 'true';
  }

  public setSimulatedOffline(enabled: boolean): void {
    if (enabled) {
      localStorage.setItem(SIMULATED_OFFLINE_KEY, 'true');
    } else {
      localStorage.removeItem(SIMULATED_OFFLINE_KEY);
    }
    this.notify();
  }
}

export const offlineCacheManager = new OfflineCacheManager();
