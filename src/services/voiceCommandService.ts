/**
 * Service de Commande Vocale & Dictée utilisant l'API Web Speech (SpeechRecognition & SpeechSynthesis).
 * Permet la navigation vocale rapide entre les modules FACTUREAU
 * et la saisie assistée par dictée vocale de relevés de compteurs d'eau.
 */

import { store } from './store';
import { Abonne, Compteur } from '../types';

export interface ParsedVoiceCommand {
  rawTranscript: string;
  type: 'NAVIGATION' | 'RELEVE_NOUVEAU' | 'RELEVE_DICTEE' | 'AIDE' | 'INCONNU';
  targetModule?: string;
  moduleLabel?: string;
  abonne?: Abonne;
  compteur?: Compteur;
  nouvelIndex?: number;
  message: string;
  feedbackVoice: string;
}

export type VoiceStateListener = (state: {
  isListening: boolean;
  transcript: string;
  lastCommand: ParsedVoiceCommand | null;
  error: string | null;
  isSupported: boolean;
}) => void;

// Words-to-numbers converter for French spoken numbers (e.g., "cent vingt" -> 120)
function parseFrenchNumber(text: string): number | null {
  const clean = text.trim().toLowerCase();

  // 1. Direct digits
  const digitMatch = clean.match(/\b\d+(\s*\d+)*\b/);
  if (digitMatch) {
    const num = parseInt(digitMatch[0].replace(/\s/g, ''), 10);
    if (!isNaN(num)) return num;
  }

  // 2. Common French number words
  const units: Record<string, number> = {
    zero: 0,
    zéro: 0,
    un: 1,
    une: 1,
    deux: 2,
    trois: 3,
    quatre: 4,
    cinq: 5,
    six: 6,
    sept: 7,
    huit: 8,
    neuf: 9,
    dix: 10,
    onze: 11,
    douze: 12,
    treize: 13,
    quatorze: 14,
    quinze: 15,
    seize: 16,
    'dix-sept': 17,
    'dix-huit': 18,
    'dix-neuf': 19,
    vingt: 20,
    trente: 30,
    quarante: 40,
    cinquante: 50,
    soixante: 60,
    cent: 100,
    mille: 1000,
  };

  const tokens = clean.split(/[\s-]+/);
  let currentTotal = 0;
  let hasFoundNumber = false;

  for (const token of tokens) {
    if (units[token] !== undefined) {
      hasFoundNumber = true;
      const val = units[token];
      if (val === 100) {
        currentTotal = currentTotal === 0 ? 100 : currentTotal * 100;
      } else if (val === 1000) {
        currentTotal = currentTotal === 0 ? 1000 : currentTotal * 1000;
      } else {
        currentTotal += val;
      }
    }
  }

  return hasFoundNumber ? currentTotal : null;
}

class VoiceCommandService {
  private recognition: any = null;
  private isListening: boolean = false;
  private transcript: string = '';
  private lastCommand: ParsedVoiceCommand | null = null;
  private error: string | null = null;
  private listeners: Set<VoiceStateListener> = new Set();
  private speechFeedbackEnabled: boolean = true;

  // External Action Handlers
  private onNavigateCallback?: (moduleId: string) => void;
  private onReleveDictatedCallback?: (data: {
    abonne?: Abonne;
    compteur?: Compteur;
    nouvelIndex?: number;
    openModal: boolean;
  }) => void;

  constructor() {
    this.initSpeechRecognition();
  }

  private initSpeechRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      this.error = "L'API Web Speech n'est pas supportée sur ce navigateur.";
      return;
    }

    try {
      this.recognition = new SpeechRec();
      this.recognition.lang = 'fr-FR';
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 2;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.error = null;
        this.notifyState();
      };

      this.recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            final += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        this.transcript = final || interim;
        this.notifyState();

        if (final) {
          this.processCommand(final);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'no-speech') {
          this.error = "Aucune voix détectée. Veuillez parler à nouveau dans le micro.";
        } else if (event.error === 'not-allowed') {
          this.error = "L'accès au microphone a été refusé par l'utilisateur ou le navigateur.";
        } else {
          this.error = `Erreur micro : ${event.error}`;
        }
        this.isListening = false;
        this.notifyState();
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.notifyState();
      };
    } catch (e) {
      console.error('Erreur initialisation Web Speech:', e);
      this.error = "Impossible d'initialiser la reconnaissance vocale.";
    }
  }

  public isSupported(): boolean {
    return !!this.recognition;
  }

  public registerActionHandlers(handlers: {
    onNavigate: (moduleId: string) => void;
    onReleveDictated: (data: {
      abonne?: Abonne;
      compteur?: Compteur;
      nouvelIndex?: number;
      openModal: boolean;
    }) => void;
  }) {
    this.onNavigateCallback = handlers.onNavigate;
    this.onReleveDictatedCallback = handlers.onReleveDictated;
  }

  public subscribe(listener: VoiceStateListener): () => void {
    this.listeners.add(listener);
    // Send immediate initial state
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notifyState() {
    const state = this.getState();
    this.listeners.forEach((fn) => fn(state));
  }

  public getState() {
    return {
      isListening: this.isListening,
      transcript: this.transcript,
      lastCommand: this.lastCommand,
      error: this.error,
      isSupported: this.isSupported(),
    };
  }

  public setSpeechFeedbackEnabled(enabled: boolean) {
    this.speechFeedbackEnabled = enabled;
  }

  public isSpeechFeedbackEnabled(): boolean {
    return this.speechFeedbackEnabled;
  }

  public startListening() {
    if (!this.recognition) {
      this.error = "Web Speech API non disponible sur cet appareil.";
      this.notifyState();
      return;
    }

    try {
      this.transcript = '';
      this.error = null;
      this.recognition.start();
    } catch {
      // recognition might already be active
      try {
        this.recognition.stop();
        setTimeout(() => this.recognition.start(), 150);
      } catch {
        // ignore
      }
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }
    this.isListening = false;
    this.notifyState();
  }

  /**
   * Synthèse vocale de confirmation en français
   */
  public speak(text: string) {
    if (!this.speechFeedbackEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    try {
      window.speechSynthesis.cancel(); // cancel previous
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      // Select French voice if available
      const voices = window.speechSynthesis.getVoices();
      const frenchVoice = voices.find((v) => v.lang.startsWith('fr') || v.name.includes('French'));
      if (frenchVoice) {
        utterance.voice = frenchVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      // speech synthesis failed or blocked
    }
  }

  /**
   * Analyse sémantique de la commande vocale dictée
   */
  public processCommand(text: string): ParsedVoiceCommand {
    const raw = text.trim();
    const clean = raw.toLowerCase();

    // 1. RELEVE DICTATION (ex: "relevé Moussa Diouf index 450", "relevé ABN-001 index 120", "compteur 002 index 300")
    if (
      clean.includes('relevé') ||
      clean.includes('releve') ||
      clean.includes('compteur') ||
      clean.includes('index')
    ) {
      // Check if this is a full dictation with a value
      const hasIndexWord = clean.includes('index') || clean.includes('nouvel index') || clean.includes('valeur');
      const parsedNumber = parseFrenchNumber(clean);

      if (hasIndexWord || parsedNumber !== null) {
        // Attempt to find subscriber by code or name
        const abonnes = store.getAbonnes();
        const compteurs = store.getCompteurs();

        let matchedAbonne: Abonne | undefined;
        let matchedCompteur: Compteur | undefined;

        // Try code match e.g. "ABN-001" or "001"
        for (const abn of abonnes) {
          const codeDigits = abn.codeAbonne.replace(/\D/g, '');
          const fullName = `${abn.prenom} ${abn.nom}`.toLowerCase();
          const lastName = abn.nom.toLowerCase();
          const firstName = abn.prenom.toLowerCase();

          if (
            clean.includes(abn.codeAbonne.toLowerCase()) ||
            (codeDigits && clean.includes(codeDigits) && (clean.includes('abn') || clean.includes('abonné') || clean.includes('abonne'))) ||
            clean.includes(fullName) ||
            (clean.includes(lastName) && lastName.length > 3) ||
            (clean.includes(firstName) && firstName.length > 3)
          ) {
            matchedAbonne = abn;
            break;
          }
        }

        // If no abonne found directly, fallback to first active or check meter serial
        if (!matchedAbonne) {
          for (const cpt of compteurs) {
            if (clean.includes(cpt.numeroSerie.toLowerCase())) {
              matchedCompteur = cpt;
              matchedAbonne = abonnes.find((a) => a.id === cpt.abonneId);
              break;
            }
          }
        }

        if (matchedAbonne) {
          matchedCompteur = compteurs.find((c) => c.id === matchedAbonne?.compteurId);
        } else {
          matchedAbonne = abonnes[0];
          matchedCompteur = compteurs.find((c) => c.id === matchedAbonne?.compteurId);
        }

        const ancienIndex = matchedCompteur?.dernierIndex || 0;
        const validNouvelIndex = parsedNumber !== null && parsedNumber >= ancienIndex
          ? parsedNumber
          : (parsedNumber !== null ? parsedNumber : ancienIndex + 15);

        const command: ParsedVoiceCommand = {
          rawTranscript: raw,
          type: 'RELEVE_DICTEE',
          targetModule: 'compteurs',
          moduleLabel: 'Compteurs & Relevés',
          abonne: matchedAbonne,
          compteur: matchedCompteur,
          nouvelIndex: validNouvelIndex,
          message: `Saisie vocale préparée pour ${matchedAbonne?.prenom} ${matchedAbonne?.nom} (${matchedAbonne?.codeAbonne}) : Nouvel index ${validNouvelIndex} m³ (ancien : ${ancienIndex} m³).`,
          feedbackVoice: `Relevé préparé pour ${matchedAbonne?.prenom} ${matchedAbonne?.nom}. Nouvel index : ${validNouvelIndex} mètres cubes.`,
        };

        this.lastCommand = command;
        this.notifyState();
        this.speak(command.feedbackVoice);

        if (this.onReleveDictatedCallback) {
          this.onReleveDictatedCallback({
            abonne: matchedAbonne,
            compteur: matchedCompteur,
            nouvelIndex: validNouvelIndex,
            openModal: true,
          });
        }
        return command;
      }

      // Simple "Nouveau relevé" command without specific index
      if (clean.includes('nouveau relevé') || clean.includes('relever compteur') || clean.includes('saisir relevé') || clean.includes('relevé')) {
        const command: ParsedVoiceCommand = {
          rawTranscript: raw,
          type: 'RELEVE_NOUVEAU',
          targetModule: 'compteurs',
          moduleLabel: 'Compteurs & Relevés',
          message: "Ouverture du formulaire de saisie de relevé de compteur.",
          feedbackVoice: "Ouverture de la saisie de relevé.",
        };

        this.lastCommand = command;
        this.notifyState();
        this.speak(command.feedbackVoice);

        if (this.onReleveDictatedCallback) {
          this.onReleveDictatedCallback({
            openModal: true,
          });
        }
        return command;
      }
    }

    // 2. NAVIGATION MODULE COMMANDS
    const navigationMap: Array<{
      keywords: string[];
      module: string;
      label: string;
      vocalVoice: string;
    }> = [
      {
        keywords: ['tableau de bord', 'accueil', 'dashboard', 'synthèse', 'statistiques', 'métriques'],
        module: 'dashboard',
        label: 'Tableau de bord',
        vocalVoice: 'Navigation vers le tableau de bord.',
      },
      {
        keywords: ['facture', 'factures', 'facturation', 'mes factures', 'émises'],
        module: 'factures',
        label: "Factures d'eau",
        vocalVoice: "Ouverture des factures d'eau.",
      },
      {
        keywords: ['paiement', 'paiements', 'payer', 'wave', 'orange money', 'paydunya', 'règlement', 'encaissement'],
        module: 'paiements',
        label: 'Paiements & Wave',
        vocalVoice: 'Ouverture des paiements et passerelle Wave.',
      },
      {
        keywords: ['abonné', 'abonnés', 'abonne', 'abonnes', 'clients', 'usagers', 'branchements'],
        module: 'abonnes',
        label: 'Abonnés',
        vocalVoice: 'Affichage des abonnés et branchements.',
      },
      {
        keywords: ['compteur', 'compteurs', 'relevé', 'relevés', 'tournée'],
        module: 'compteurs',
        label: 'Compteurs & Relevés',
        vocalVoice: 'Accès aux compteurs et relevés.',
      },
      {
        keywords: ['caisse', 'dépense', 'dépenses', 'trésorerie', 'décaissement'],
        module: 'caisse',
        label: 'Caisse & Dépenses',
        vocalVoice: 'Ouverture de la caisse et des dépenses.',
      },
      {
        keywords: ['borne', 'bornes', 'fontaine', 'fontaines', 'borne-fontaine'],
        module: 'bornes',
        label: 'Bornes-Fontaines',
        vocalVoice: 'Affichage des bornes-fontaines.',
      },
      {
        keywords: ['production', 'pompage', 'perte', 'pertes', 'stock', 'stocks', 'chlore'],
        module: 'production',
        label: 'Production & Pertes',
        vocalVoice: 'Accès à la production et aux stocks de sécurité.',
      },
      {
        keywords: ['panne', 'pannes', 'maintenance', 'entretien', 'réparation', 'incident'],
        module: 'pannes',
        label: 'Pannes & Entretien',
        vocalVoice: 'Affichage des pannes et de la maintenance.',
      },
      {
        keywords: ['coupure', 'coupures', 'impayé', 'impayés', 'relance', 'relances'],
        module: 'coupures',
        label: 'Impayés & Coupures',
        vocalVoice: 'Ouverture du suivi des impayés et coupures.',
      },
      {
        keywords: ['sms', 'alerte sms', 'alertes sms', 'passerelle sms'],
        module: 'sms-alerts',
        label: 'Alertes SMS & Passerelle',
        vocalVoice: 'Affichage de la passerelle SMS.',
      },
      {
        keywords: ['rapport', 'rapports', 'état', 'états', 'bilan', 'bilans', 'pdf'],
        module: 'rapports',
        label: 'Rapports & États',
        vocalVoice: 'Ouverture des rapports et exports.',
      },
      {
        keywords: ['audit', 'journal', 'logs', 'traçabilité'],
        module: 'audit',
        label: "Logs d'Audit & Actions",
        vocalVoice: "Accès au journal d'audit immuable.",
      },
      {
        keywords: ['sécurité', 'securite', 'rbac', 'tests'],
        module: 'security',
        label: 'Tests de Sécurité RBAC',
        vocalVoice: 'Affichage des tests de sécurité.',
      },
      {
        keywords: ['schéma', 'schema', 'sql', 'postgres', 'base de données'],
        module: 'schema',
        label: 'Schéma PostgreSQL',
        vocalVoice: 'Affichage du schéma PostgreSQL.',
      },
      {
        keywords: ['forage', 'forages', 'ouvrage', 'ouvrages'],
        module: 'forages',
        label: 'Forages',
        vocalVoice: 'Affichage des ouvrages de forage.',
      },
    ];

    for (const nav of navigationMap) {
      if (nav.keywords.some((kw) => clean.includes(kw))) {
        const command: ParsedVoiceCommand = {
          rawTranscript: raw,
          type: 'NAVIGATION',
          targetModule: nav.module,
          moduleLabel: nav.label,
          message: `Commande reconnue : Navigation vers le module "${nav.label}".`,
          feedbackVoice: nav.vocalVoice,
        };

        this.lastCommand = command;
        this.notifyState();
        this.speak(command.feedbackVoice);

        if (this.onNavigateCallback) {
          this.onNavigateCallback(nav.module);
        }
        return command;
      }
    }

    // 3. Fallback / Unknown Command
    const unknownCommand: ParsedVoiceCommand = {
      rawTranscript: raw,
      type: 'INCONNU',
      message: `Commande non reconnue : "${raw}". Essayez par exemple : "Aller aux factures", "Relever compteur", ou "Relevé Moussa Diouf index 450".`,
      feedbackVoice: "Je n'ai pas compris votre commande. Vous pouvez dire Aller aux factures, ou Relevé compteur.",
    };

    this.lastCommand = unknownCommand;
    this.notifyState();
    this.speak(unknownCommand.feedbackVoice);
    return unknownCommand;
  }
}

export const voiceCommandService = new VoiceCommandService();
