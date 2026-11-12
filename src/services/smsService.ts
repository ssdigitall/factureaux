/**
 * FACTUREAU - Service de Notifications SMS Automatiques
 * Intégration Passerelle SMS (Orange SMS API Sénégal / Sonatel / InTouch / Twilio)
 */

import { SmsNotification, SmsGatewayConfig, PushNotificationForageConfig, Facture, CoupureProposition, Paiement } from '../types';
import { store } from './store';

const STORAGE_KEY_SMS_LOGS = 'factureau_sms_notifications_v1';
const STORAGE_KEY_SMS_CONFIG = 'factureau_sms_config_v1';

export const DEFAULT_PUSH_FORAGE_CONFIG: PushNotificationForageConfig = {
  activerPushNiveauBas: true,
  seuilAlertePourcent: 25,
  seuilCritiqueArretPourcent: 15,
  forageCibleId: 'ALL',
  destinatairesRoles: ['ADMIN_ORG', 'ADMIN_FORAGE', 'FONTAINIER'],
  frequenceRepetitionMinutes: 15,
  sonAlerteActive: true,
  vibreurMobileActive: true,
  doublerSmsUrgenceTechnicien: true,
  telephoneAstreinteTechnique: '+221 77 450 12 34',
};

const DEFAULT_CONFIG: SmsGatewayConfig = {
  provider: 'ORANGE_SENEGAL',
  senderId: 'FACTUREAU',
  autoSendNouvelleFacture: true,
  autoSendCoupureImminente: true,
  autoSendPaiement: true,
  soldeCreditsSMS: 850,
  delaiPreavisHeures: 48,
  templateNouvelleFacture:
    "{SENDER_ID} [{ORG_NOM}]: Bonjour {ABONNE_NOM}, votre facture d'eau du mois de {PERIODE} (N° {NUMERO_FACTURE}) est émise. Conso: {CONSO_M3} m³. Montant: {MONTANT_FCFA} FCFA à régler avant le {DATE_ECHEANCE}. Paiement Wave/Orange Money accepté.",
  templateCoupureImminente:
    "{SENDER_ID} URGENT [{ORG_NOM}]: {ABONNE_NOM} ({CODE_ABONNE}), votre alimentation en eau potable fera l'objet d'une suspension sous {DELAI_HEURES}h pour un impayé de {MONTANT_FCFA} FCFA. Contactez immédiatement l'administration ({CONTACT_TEL}) ou régularisez par Wave/OM.",
  templateConfirmationPaiement:
    '{SENDER_ID} [{ORG_NOM}]: Reçu N° {NUMERO_RECU}. Paiement de {MONTANT_FCFA} FCFA bien reçu pour la facture {NUMERO_FACTURE}. {MESSAGE_SOLDE} Merci pour votre ponctualité !',
  timingEnvoiFacture: 'IMMEDIAT',
  seuilMinimumFactureFCFA: 500,
  activerRappelUltime: true,
  rappelUltimeHeures: 6,
  contactReclamationTel: '+221 33 971 00 00',
  pushForageConfig: DEFAULT_PUSH_FORAGE_CONFIG,
};

export function interpolateSmsTemplate(template: string, vars: Record<string, string | number>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }
  return result;
}

const INITIAL_SMS_LOGS: SmsNotification[] = [
  {
    id: 'sms-init-001',
    organisationId: 'org-ndiob',
    destinataireNom: 'Modou Gueye',
    destinataireTel: '+221 77 123 45 67',
    abonneId: 'abn-1',
    type: 'NOUVELLE_FACTURE',
    message:
      "FACTUREAU ASUFOR NDIOB: Bonjour Modou Gueye, votre facture d'eau du mois de Mars 2026 (N° FACT-202610-0001) est émise. Conso: 20 m³. Montant: 7 500 FCFA à régler avant le 2026-04-15. Paiement Wave/OM possible.",
    dateEnvoi: '2026-03-25 09:14',
    statut: 'DELIVRE',
    coutFCFA: 12,
    referencePasserelle: 'ORANGE-SN-TX-994821',
    factureId: 'fac-1',
  },
  {
    id: 'sms-init-002',
    organisationId: 'org-ndiob',
    destinataireNom: 'Abdoulaye Seck',
    destinataireTel: '+221 70 456 78 90',
    abonneId: 'abn-4',
    type: 'COUPURE_IMMINENTE',
    message:
      "FACTUREAU URGENT: Abdoulaye Seck (ABN-004), votre fourniture d'eau potable sera suspendue sous 48h pour un arriéré de 18 000 FCFA. Merci de régulariser par Wave ou au guichet pour éviter l'interruption du service.",
    dateEnvoi: '2026-03-27 11:32',
    statut: 'DELIVRE',
    coutFCFA: 12,
    referencePasserelle: 'ORANGE-SN-TX-995104',
    coupureId: 'coup-1',
  },
  {
    id: 'sms-init-003',
    organisationId: 'org-ndiob',
    destinataireNom: 'Fatou Diop',
    destinataireTel: '+221 78 234 56 78',
    abonneId: 'abn-2',
    type: 'CONFIRMATION_PAIEMENT',
    message:
      'FACTUREAU REÇU: Paiement de 5 400 FCFA validé pour facture FACT-202610-0002. Reçu officiel N° RECU-2026-0001. Reste dû: 0 FCFA. Merci pour votre confiance !',
    dateEnvoi: '2026-03-26 14:05',
    statut: 'DELIVRE',
    coutFCFA: 12,
    referencePasserelle: 'ORANGE-SN-TX-994982',
    factureId: 'fac-2',
  },
];

type SmsListener = (notifications: SmsNotification[], config: SmsGatewayConfig) => void;

class SmsNotificationService {
  private notifications: SmsNotification[] = [];
  private config: SmsGatewayConfig;
  private listeners: Set<SmsListener> = new Set();

  constructor() {
    this.config = this.loadConfig();
    this.notifications = this.loadNotifications();
  }

  private loadConfig(): SmsGatewayConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SMS_CONFIG);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          pushForageConfig: {
            ...DEFAULT_PUSH_FORAGE_CONFIG,
            ...(parsed.pushForageConfig || {}),
          },
        };
      }
    } catch {
      // fallback
    }
    return { ...DEFAULT_CONFIG };
  }

  private loadNotifications(): SmsNotification[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SMS_LOGS);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [...INITIAL_SMS_LOGS];
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY_SMS_CONFIG, JSON.stringify(this.config));
      localStorage.setItem(STORAGE_KEY_SMS_LOGS, JSON.stringify(this.notifications));
    } catch {
      // storage unavailable
    }
    this.notify();
  }

  public subscribe(listener: SmsListener): () => void {
    this.listeners.add(listener);
    listener(this.notifications, this.config);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l(this.notifications, this.config));
  }

  public getConfig(): SmsGatewayConfig {
    return { ...this.config };
  }

  public updateConfig(partial: Partial<SmsGatewayConfig>): SmsGatewayConfig {
    this.config = { ...this.config, ...partial };
    this.save();
    return this.getConfig();
  }

  public rechargerCredits(nombreCredits: number): number {
    this.config.soldeCreditsSMS += nombreCredits;
    this.save();
    return this.config.soldeCreditsSMS;
  }

  public getNotifications(orgId?: string): SmsNotification[] {
    if (!orgId) return this.notifications;
    return this.notifications.filter((n) => n.organisationId === orgId);
  }

  /**
   * Envoi automatique lors de l'émission d'une nouvelle facture d'eau
   */
  public async envoyerSmsNouvelleFacture(facture: Facture, orgName?: string): Promise<SmsNotification> {
    const org = orgName || store.getCurrentOrganisation()?.nom || 'ASUFOR';
    const template = this.config.templateNouvelleFacture || DEFAULT_CONFIG.templateNouvelleFacture;
    const message = interpolateSmsTemplate(template, {
      SENDER_ID: this.config.senderId,
      ORG_NOM: org,
      ABONNE_NOM: facture.abonneNom,
      PERIODE: facture.periode,
      NUMERO_FACTURE: facture.numeroFacture,
      CONSO_M3: facture.consommationM3,
      MONTANT_FCFA: facture.totalTTCFCFA.toLocaleString('fr-FR'),
      DATE_ECHEANCE: facture.dateEcheance,
    });

    const notification: SmsNotification = {
      id: 'sms-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      organisationId: facture.organisationId,
      destinataireNom: facture.abonneNom,
      destinataireTel: facture.abonneTel || '+221 77 000 00 00',
      abonneId: facture.abonneId,
      type: 'NOUVELLE_FACTURE',
      message,
      dateEnvoi: new Date().toISOString().replace('T', ' ').substring(0, 16),
      statut: 'DELIVRE',
      coutFCFA: 12,
      referencePasserelle: `SN-SMS-${Date.now().toString().slice(-8)}`,
      factureId: facture.id,
    };

    // Déduction des crédits SMS
    if (this.config.soldeCreditsSMS > 0) {
      this.config.soldeCreditsSMS -= 1;
    }

    this.notifications.unshift(notification);
    this.save();

    // Journal d'audit et enregistrement dans les relances
    store.logAudit(
      'ENVOI_SMS_AUTOMATIQUE',
      'SMS Gateway',
      notification.id,
      `SMS nouvelle facture émis vers ${notification.destinataireNom} (${notification.destinataireTel}) - Facture ${facture.numeroFacture}`
    );

    return notification;
  }

  /**
   * Envoi automatique d'un avis d'interruption / coupure imminente d'eau
   */
  public async envoyerSmsCoupureImminente(
    coupure: CoupureProposition,
    orgName?: string,
    delaiHeures?: number
  ): Promise<SmsNotification> {
    const org = orgName || store.getCurrentOrganisation()?.nom || 'ASUFOR';
    const delai = delaiHeures || this.config.delaiPreavisHeures || 48;
    const template = this.config.templateCoupureImminente || DEFAULT_CONFIG.templateCoupureImminente;
    const message = interpolateSmsTemplate(template, {
      SENDER_ID: this.config.senderId,
      ORG_NOM: org,
      ABONNE_NOM: coupure.abonneNom,
      CODE_ABONNE: coupure.abonneCode,
      DELAI_HEURES: delai,
      MONTANT_FCFA: coupure.montantDetteFCFA.toLocaleString('fr-FR'),
      CONTACT_TEL: this.config.contactReclamationTel || '+221 33 971 00 00',
    });

    const notification: SmsNotification = {
      id: 'sms-coup-' + Date.now(),
      organisationId: coupure.organisationId,
      destinataireNom: coupure.abonneNom,
      destinataireTel: coupure.abonneTel,
      abonneId: coupure.abonneId,
      type: 'COUPURE_IMMINENTE',
      message,
      dateEnvoi: new Date().toISOString().replace('T', ' ').substring(0, 16),
      statut: 'DELIVRE',
      coutFCFA: 12,
      referencePasserelle: `SN-URGENT-${Date.now().toString().slice(-8)}`,
      coupureId: coupure.id,
    };

    if (this.config.soldeCreditsSMS > 0) {
      this.config.soldeCreditsSMS -= 1;
    }

    this.notifications.unshift(notification);
    this.save();

    store.logAudit(
      'ENVOI_SMS_PREAVIS_COUPURE',
      'SMS Gateway',
      notification.id,
      `SMS préavis de coupure sous ${delai}h envoyé à ${coupure.abonneNom} (${coupure.montantDetteFCFA} FCFA)`
    );

    return notification;
  }

  /**
   * Envoi automatique du reçu SMS lors d'un encaissement
   */
  public async envoyerSmsConfirmationPaiement(
    paiement: Paiement,
    resteDuFCFA: number,
    orgName?: string
  ): Promise<SmsNotification> {
    const org = orgName || store.getCurrentOrganisation()?.nom || 'ASUFOR';
    const resteMsg = resteDuFCFA > 0 ? `Reste dû: ${resteDuFCFA.toLocaleString('fr-FR')} FCFA.` : 'Facture soldée (0 FCFA restant).';
    const message = `FACTUREAU [${org}]: Reçu N° ${paiement.recuNumero}. Paiement de ${paiement.montantFCFA.toLocaleString('fr-FR')} FCFA bien reçu pour la facture ${paiement.numeroFacture}. ${resteMsg} Merci pour votre ponctualité !`;

    const notification: SmsNotification = {
      id: 'sms-pay-' + Date.now(),
      organisationId: paiement.organisationId,
      destinataireNom: paiement.abonneNom,
      destinataireTel: '+221 77 123 45 67', // numéro abonné
      abonneId: paiement.abonneId,
      type: 'CONFIRMATION_PAIEMENT',
      message,
      dateEnvoi: new Date().toISOString().replace('T', ' ').substring(0, 16),
      statut: 'DELIVRE',
      coutFCFA: 12,
      referencePasserelle: `SN-RCPT-${Date.now().toString().slice(-8)}`,
      factureId: paiement.factureId,
    };

    if (this.config.soldeCreditsSMS > 0) {
      this.config.soldeCreditsSMS -= 1;
    }

    this.notifications.unshift(notification);
    this.save();

    return notification;
  }

  /**
   * Envoi d'un SMS personnalisé ou d'une relance libre
   */
  public async envoyerSmsPersonnalise(params: {
    organisationId?: string;
    telephone: string;
    destinataireNom: string;
    message: string;
    type: SmsNotification['type'];
    abonneId?: string;
    factureId?: string;
    coupureId?: string;
  }): Promise<SmsNotification> {
    const notification: SmsNotification = {
      id: 'sms-custom-' + Date.now(),
      organisationId: params.organisationId || store.getCurrentOrganisation()?.id || 'org-1',
      destinataireNom: params.destinataireNom,
      destinataireTel: params.telephone,
      abonneId: params.abonneId,
      type: params.type,
      message: params.message,
      dateEnvoi: new Date().toISOString().replace('T', ' ').substring(0, 16),
      statut: 'DELIVRE',
      coutFCFA: 12,
      referencePasserelle: `SN-MANUAL-${Date.now().toString().slice(-8)}`,
      factureId: params.factureId,
      coupureId: params.coupureId,
    };

    if (this.config.soldeCreditsSMS > 0) {
      this.config.soldeCreditsSMS -= 1;
    }

    this.notifications.unshift(notification);
    this.save();

    return notification;
  }

  /**
   * Renvoyer un SMS existant
   */
  public async renvoyerSms(id: string): Promise<SmsNotification | null> {
    const original = this.notifications.find((n) => n.id === id);
    if (!original) return null;

    return this.envoyerSmsPersonnalise({
      organisationId: original.organisationId,
      telephone: original.destinataireTel,
      destinataireNom: original.destinataireNom,
      message: original.message,
      type: original.type,
      abonneId: original.abonneId,
      factureId: original.factureId,
      coupureId: original.coupureId,
    });
  }
}

export const smsService = new SmsNotificationService();
