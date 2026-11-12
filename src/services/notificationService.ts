/**
 * Service de Notifications Temps Réel & Push pour FACTUREAU.
 * Gère les alertes de nouveaux paiements (Wave, OM, PayDunya, Caisse),
 * les pannes et alertes de maintenance critiques, le niveau de stocks
 * et le rendement hydraulique du réseau.
 */

import { store } from './store';
import { formatFCFA } from '../utils/formatters';

export type NotificationCategory =
  | 'PAIEMENT'
  | 'MAINTENANCE'
  | 'STOCK'
  | 'HYDRAULIQUE'
  | 'IMPAYE'
  | 'SYSTEME';

export type NotificationPriority = 'CRITIQUE' | 'HAUTE' | 'NORMALE';

export interface RealtimeNotification {
  id: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  moduleTarget: string; // 'paiements' | 'pannes' | 'production' | 'factures' | 'coupures'
  actionLabel?: string;
  metadata?: {
    montantFCFA?: number;
    modePaiement?: string;
    forageNom?: string;
    gravite?: string;
    abonneNom?: string;
    articleNom?: string;
  };
}

const STORAGE_KEY_NOTIFS = 'factureau_realtime_notifications_v1';
const STORAGE_KEY_SETTINGS = 'factureau_notif_settings_v1';

export interface NotificationSettings {
  browserPushEnabled: boolean;
  soundEnabled: boolean;
  notifyPayments: boolean;
  notifyMaintenance: boolean;
  notifyStocks: boolean;
  notifyHydraulics: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  browserPushEnabled: false,
  soundEnabled: true,
  notifyPayments: true,
  notifyMaintenance: true,
  notifyStocks: true,
  notifyHydraulics: true,
};

// Initial notifications to ensure immediate rich feedback
const INITIAL_NOTIFICATIONS: RealtimeNotification[] = [
  {
    id: 'notif-crit-1',
    category: 'MAINTENANCE',
    priority: 'CRITIQUE',
    title: 'Alerte Maintenance Critique : Forage F1',
    message: 'Baisse de pression anormale & vibration anormale moteur pompe immergée 15kW. Intervention urgente requise.',
    timestamp: Date.now() - 1000 * 60 * 12, // 12 mins ago
    read: false,
    moduleTarget: 'pannes',
    actionLabel: 'Inspecter la panne',
    metadata: {
      forageNom: 'Forage F1 - Centre Ville',
      gravite: 'HAUTE',
    },
  },
  {
    id: 'notif-pay-1',
    category: 'PAIEMENT',
    priority: 'NORMALE',
    title: 'Nouveau Paiement Mobile Money Encaissé',
    message: 'Encaissement Wave reçu : 12.500 FCFA pour la Facture FAC-2026-001 (Moussa Diouf).',
    timestamp: Date.now() - 1000 * 60 * 25, // 25 mins ago
    read: false,
    moduleTarget: 'paiements',
    actionLabel: 'Voir le reçu',
    metadata: {
      montantFCFA: 12500,
      modePaiement: 'WAVE',
      abonneNom: 'Moussa Diouf',
    },
  },
  {
    id: 'notif-pay-2',
    category: 'PAIEMENT',
    priority: 'NORMALE',
    title: 'Paiement PayDunya Validé par Webhook IPN',
    message: 'Règlement Orange Money de 8.200 FCFA pour la Facture FAC-2026-003 (Awa Ndiaye).',
    timestamp: Date.now() - 1000 * 60 * 55, // 55 mins ago
    read: false,
    moduleTarget: 'paiements',
    actionLabel: 'Détails transaction',
    metadata: {
      montantFCFA: 8200,
      modePaiement: 'ORANGE_MONEY',
      abonneNom: 'Awa Ndiaye',
    },
  },
  {
    id: 'notif-stock-1',
    category: 'STOCK',
    priority: 'HAUTE',
    title: 'Seuil Critique : Réserve de Chlore HTH 70%',
    message: 'Le stock de chlore de désinfection est à 15 kg (seuil de sécurité critique : 20 kg). Réapprovisionnement requis.',
    timestamp: Date.now() - 1000 * 60 * 120, // 2h ago
    read: true,
    moduleTarget: 'production',
    actionLabel: 'Gérer les stocks',
    metadata: {
      articleNom: 'Chlore HTH 70% granulés',
    },
  },
  {
    id: 'notif-hydr-1',
    category: 'HYDRAULIQUE',
    priority: 'HAUTE',
    title: 'Surveillance Pertes Réseau (NRW)',
    message: 'Rendement hydraulique mensuel calculé à 81.2% (pertes réseau estimées : 18.8%, au-dessus du seuil contractuel de 18%).',
    timestamp: Date.now() - 1000 * 60 * 240, // 4h ago
    read: true,
    moduleTarget: 'production',
    actionLabel: 'Bilan production',
  },
];

class NotificationService {
  private notifications: RealtimeNotification[] = [];
  private settings: NotificationSettings = DEFAULT_SETTINGS;
  private listeners: Set<() => void> = new Set();
  private audioContext: AudioContext | null = null;
  private knownPaymentIds: Set<string> = new Set();
  private knownPanneIds: Set<string> = new Set();

  constructor() {
    this.loadFromStorage();
    this.initStoreWatcher();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_NOTIFS);
      if (stored) {
        this.notifications = JSON.parse(stored);
      } else {
        this.notifications = [...INITIAL_NOTIFICATIONS];
        this.saveToStorage();
      }

      const storedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (storedSettings) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) };
      }
    } catch {
      this.notifications = [...INITIAL_NOTIFICATIONS];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(this.notifications));
    } catch {
      // storage full or disabled
    }
  }

  private saveSettingsToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(this.settings));
    } catch {
      // storage full or disabled
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('Erreur listener notification:', err);
      }
    });
  }

  public getNotifications(): RealtimeNotification[] {
    return [...this.notifications].sort((a, b) => b.timestamp - a.timestamp);
  }

  public getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  public getCriticalCount(): number {
    return this.notifications.filter((n) => !n.read && n.priority === 'CRITIQUE').length;
  }

  public getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<NotificationSettings>) {
    this.settings = { ...this.settings, ...partial };
    this.saveSettingsToStorage();
    this.notifyListeners();
  }

  public markAsRead(id: string) {
    const notif = this.notifications.find((n) => n.id === id);
    if (notif && !notif.read) {
      notif.read = true;
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  public markAllAsRead() {
    this.notifications.forEach((n) => (n.read = true));
    this.saveToStorage();
    this.notifyListeners();
  }

  public deleteNotification(id: string) {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.saveToStorage();
    this.notifyListeners();
  }

  public clearAll() {
    this.notifications = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Ajoute une nouvelle alerte et déclenche le son et/ou la notification push
   */
  public addNotification(notification: Omit<RealtimeNotification, 'id' | 'timestamp' | 'read'>) {
    const newNotif: RealtimeNotification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      read: false,
    };

    // Keep max 50 notifications in buffer
    this.notifications = [newNotif, ...this.notifications].slice(0, 50);
    this.saveToStorage();

    // Sound chime
    if (this.settings.soundEnabled) {
      this.playNotificationSound(newNotif.priority);
    }

    // Native browser push notification
    if (this.settings.browserPushEnabled) {
      this.triggerNativeBrowserPush(newNotif);
    }

    this.notifyListeners();
    return newNotif;
  }

  /**
   * Joue un carillon doux et moderne synthétisé via Web Audio API (sans dépendance externe)
   */
  public playNotificationSound(priority: NotificationPriority = 'NORMALE') {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioContext) {
        this.audioContext = new AudioCtx();
      }

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const now = this.audioContext.currentTime;

      if (priority === 'CRITIQUE') {
        // Double tone urgent chime: 880Hz -> 660Hz -> 880Hz
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(660, now + 0.12);
        osc.frequency.setValueAtTime(880, now + 0.24);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start(now);
        osc.stop(now + 0.45);
      } else {
        // Melodic positive chime: 523.25Hz (C5) -> 659.25Hz (E5) -> 783.99Hz (G5)
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq, idx) => {
          if (!this.audioContext) return;
          const osc = this.audioContext.createOscillator();
          const gain = this.audioContext.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);

          gain.gain.setValueAtTime(0.12, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);

          osc.connect(gain);
          gain.connect(this.audioContext.destination);

          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.25);
        });
      }
    } catch {
      // Audio playback blocked or unsupported in background
    }
  }

  /**
   * Déclenche une vraie notification native du navigateur via l'API Web Notification
   */
  public async requestBrowserNotificationPermission(): Promise<'granted' | 'denied' | 'default'> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.updateSettings({ browserPushEnabled: true });
        this.addNotification({
          category: 'SYSTEME',
          priority: 'NORMALE',
          title: 'Notifications Push Activées',
          message: 'Vous recevrez désormais les alertes de nouveaux paiements et pannes en direct.',
          moduleTarget: 'dashboard',
        });
      } else {
        this.updateSettings({ browserPushEnabled: false });
      }
      return permission;
    } catch {
      return 'denied';
    }
  }

  private triggerNativeBrowserPush(notif: RealtimeNotification) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    try {
      const n = new Notification(`FACTUREAU : ${notif.title}`, {
        body: notif.message,
        icon: '/icon.svg',
        badge: '/icon.svg',
        tag: notif.id,
      });

      n.onclick = () => {
        window.focus();
        n.close();
      };
    } catch {
      // Browser notification failed or background restricted
    }
  }

  /**
   * Surveillance automatique du store FACTUREAU pour détecter de nouveaux événements
   */
  private initStoreWatcher() {
    // Initial populate of known IDs
    store.getPaiements().forEach((p) => this.knownPaymentIds.add(p.id));
    store.getPannes().forEach((p) => this.knownPanneIds.add(p.id));

    store.subscribe(() => {
      // Check for new payments
      const payments = store.getPaiements();
      payments.forEach((p) => {
        if (!this.knownPaymentIds.has(p.id)) {
          this.knownPaymentIds.add(p.id);
          this.addNotification({
            category: 'PAIEMENT',
            priority: 'NORMALE',
            title: `Nouveau Paiement Reçu (${p.modePaiement})`,
            message: `Encaissement de ${formatFCFA(p.montantFCFA)} validé pour ${p.abonneNom}. Reçu N° ${p.recuNumero}.`,
            moduleTarget: 'paiements',
            actionLabel: 'Consulter paiements',
            metadata: {
              montantFCFA: p.montantFCFA,
              modePaiement: p.modePaiement,
              abonneNom: p.abonneNom,
            },
          });
        }
      });

      // Check for new high-gravity maintenance issues
      const pannes = store.getPannes();
      pannes.forEach((panne) => {
        if (!this.knownPanneIds.has(panne.id)) {
          this.knownPanneIds.add(panne.id);
          if (panne.gravite === 'HAUTE' && panne.statut !== 'REPARE') {
            this.addNotification({
              category: 'MAINTENANCE',
              priority: 'CRITIQUE',
              title: `Panne Critique Signalée : ${panne.titre}`,
              message: `${panne.forageNom} : ${panne.description}. Intervention technique d'urgence requise.`,
              moduleTarget: 'pannes',
              actionLabel: 'Intervenir sur la panne',
              metadata: {
                forageNom: panne.forageNom,
                gravite: panne.gravite,
              },
            });
          }
        }
      });
    });
  }

  // --- Simulateurs pour tests et démos interactives ---
  public simulateNewPayment(channel: 'WAVE' | 'ORANGE_MONEY' | 'PAYDUNYA' = 'WAVE') {
    const clients = ['Ousmane Sow', 'Fatou Fall', 'Babacar Diagne', 'Mariama Ba', 'Cheikh Ndiaye'];
    const randomClient = clients[Math.floor(Math.random() * clients.length)];
    const amounts = [6500, 8500, 12500, 15000, 22000];
    const amount = amounts[Math.floor(Math.random() * amounts.length)];

    return this.addNotification({
      category: 'PAIEMENT',
      priority: 'NORMALE',
      title: `Paiement ${channel.replace('_', ' ')} Reçu`,
      message: `Règlement instantané de ${formatFCFA(amount)} confirmé pour ${randomClient}. Transaction validée.`,
      moduleTarget: 'paiements',
      actionLabel: 'Voir le règlement',
      metadata: {
        montantFCFA: amount,
        modePaiement: channel,
        abonneNom: randomClient,
      },
    });
  }

  public simulateCriticalMaintenanceAlert() {
    const forages = ['Forage Central ASUFOR', 'Forage Escale Sud', 'Forage Hôpital'];
    const randomForage = forages[Math.floor(Math.random() * forages.length)];
    const incidents = [
      'Disjonction thermique du groupe motopompe après surtension électrique.',
      'Rupture de bride d’étanchéité au refoulement - Risque d’inondation de la station.',
      'Chute brutale de pression réseau (< 0.8 bar) - Arrêt automatique de sécurité.',
    ];
    const incident = incidents[Math.floor(Math.random() * incidents.length)];

    return this.addNotification({
      category: 'MAINTENANCE',
      priority: 'CRITIQUE',
      title: 'Alerte Maintenance Critique Immédiate',
      message: `${randomForage} : ${incident}`,
      moduleTarget: 'pannes',
      actionLabel: 'Consulter la panne',
      metadata: {
        forageNom: randomForage,
        gravite: 'HAUTE',
      },
    });
  }
}

export const notificationService = new NotificationService();
