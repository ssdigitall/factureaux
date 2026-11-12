/**
 * FACTUREAU - Telemetry & Real-Time Polling Service
 * Gère le polling léger, la synchronisation continue et la simulation de flux télémétrique
 * pour les forages et les encaissements mobiles (Wave / Orange Money).
 */

import { store } from './store';

export type TelemetryEventType = 'PRODUCTION' | 'PAIEMENT' | 'HEARTBEAT';

export interface TelemetryEvent {
  id: string;
  timestamp: string;
  type: TelemetryEventType;
  title: string;
  description: string;
  valeurFormatee: string;
}

export interface TelemetryStatus {
  isRunning: boolean;
  intervalMs: number;
  lastSyncDate: Date;
  secondsSinceLastSync: number;
  pulseCount: number;
  lastEvent: TelemetryEvent | null;
}

class TelemetryService {
  private timer: NodeJS.Timeout | null = null;
  private intervalMs: number = 6000; // 6s léger par défaut
  private isRunning: boolean = true;
  private lastSyncDate: Date = new Date();
  private pulseCount: number = 0;
  private lastEvent: TelemetryEvent | null = null;
  private listeners: Set<(status: TelemetryStatus) => void> = new Set();
  private isTabVisible: boolean = true;

  constructor() {
    // Initialise last event
    this.lastEvent = {
      id: 'init-telemetry',
      timestamp: new Date().toLocaleTimeString('fr-FR'),
      type: 'HEARTBEAT',
      title: 'Télémétrie connectée',
      description: 'Liaison temps réel active avec les automates de forage',
      valeurFormatee: 'En service',
    };

    // Auto pause when browser tab is inactive to optimize memory & CPU
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        this.isTabVisible = !document.hidden;
        if (!this.isTabVisible && this.timer) {
          // Pause background interval
          this.clearIntervalTimer();
        } else if (this.isTabVisible && this.isRunning) {
          // Resume interval immediately
          this.triggerPulse();
          this.startIntervalTimer();
        }
      });
    }

    // Auto-start
    this.startIntervalTimer();
  }

  private startIntervalTimer(): void {
    this.clearIntervalTimer();
    this.timer = setInterval(() => {
      if (this.isRunning && this.isTabVisible) {
        this.triggerPulse();
      }
    }, this.intervalMs);
  }

  private clearIntervalTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public subscribe(listener: (status: TelemetryStatus) => void): () => void {
    this.listeners.add(listener);
    // Send immediate snapshot
    listener(this.getStatus());
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const status = this.getStatus();
    this.listeners.forEach((fn) => {
      try {
        fn(status);
      } catch (err) {
        console.error('Error in telemetry listener:', err);
      }
    });
  }

  public getStatus(): TelemetryStatus {
    const now = Date.now();
    const diffSec = Math.max(0, Math.floor((now - this.lastSyncDate.getTime()) / 1000));
    return {
      isRunning: this.isRunning,
      intervalMs: this.intervalMs,
      lastSyncDate: this.lastSyncDate,
      secondsSinceLastSync: diffSec,
      pulseCount: this.pulseCount,
      lastEvent: this.lastEvent,
    };
  }

  public start(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      this.startIntervalTimer();
      this.triggerPulse();
      this.notify();
    }
  }

  public stop(): void {
    if (this.isRunning) {
      this.isRunning = false;
      this.clearIntervalTimer();
      this.notify();
    }
  }

  public toggle(): boolean {
    if (this.isRunning) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  public setIntervalMs(ms: number): void {
    this.intervalMs = Math.max(2000, ms);
    if (this.isRunning) {
      this.startIntervalTimer();
    }
    this.notify();
  }

  /**
   * Triggers a live telemetry pulse: incremental water pumping or digital payment
   */
  public triggerPulse(): void {
    this.lastSyncDate = new Date();
    this.pulseCount += 1;

    try {
      const result = store.simulateLiveTelemetryPulse();
      if (result) {
        this.lastEvent = {
          id: `evt-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('fr-FR'),
          type: result.type,
          title: result.title,
          description: result.details,
          valeurFormatee: result.valeurFormatee,
        };
      }
    } catch (e) {
      console.warn('Telemetry pulse execution warning:', e);
    }

    this.notify();
  }
}

export const telemetryService = new TelemetryService();
