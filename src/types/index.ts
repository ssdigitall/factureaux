/**
 * FACTUREAU - Types & Domain Models
 * Application SaaS de Gestion des Forages et de la Distribution d'Eau
 */

export type SaaSPlan = 'ESSENTIEL' | 'PROFESSIONNEL' | 'ENTREPRISE';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN_ORG'
  | 'ADMIN_FORAGE'
  | 'TRESORIER'
  | 'RELEVEUR'
  | 'FONTAINIER'
  | 'LECTEUR';

export interface PlanQuotas {
  maxForages: number;
  maxAbonnes: number;
  maxUsers: number;
  bornesIncluses: boolean;
  productionIncluse: boolean;
  exportsAvances: boolean;
}

export interface Organisation {
  id: string;
  code: string;
  nom: string;
  pays: string;
  region: string;
  departement: string;
  commune: string;
  contactEmail: string;
  contactTel: string;
  devise: string; // e.g. "FCFA"
  statut: 'ACTIF' | 'SUSPENDU' | 'EN_ATTENTE';
  plan: SaaSPlan;
  quotas: PlanQuotas;
  dateCreation: string;
}

export interface UserProfile {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone: string;
  role: UserRole;
  organisationId: string;
  organisationNom?: string;
  foragesAttribues: string[]; // IDs des forages assignés
  bornesAttribuees?: string[]; // IDs des bornes assignées (pour fontainier)
  statut: 'ACTIF' | 'SUSPENDU';
  mfaActive: boolean;
  dateCreation: string;
  dernierAcces: string;
}

export type PompeType = 'SOLAIRE' | 'THERMIQUE' | 'HYBRIDE' | 'ELECTRIQUE_RESEAU';

export interface Forage {
  id: string;
  organisationId: string;
  code: string;
  nom: string;
  localite: string;
  region: string;
  profondeurMetres: number;
  debitNominalM3H: number;
  typePompe: PompeType;
  puissanceKw: number;
  dateMiseEnService: string;
  responsableNom: string;
  responsableTel: string;
  statut: 'EN_SERVICE' | 'EN_PANNE' | 'EN_MAINTENANCE';
  tarifM3FCFA: number;
  redevanceFixeFCFA: number;
}

export type CategorieAbonne = 'DOMESTIQUE' | 'COMMERCIAL' | 'MARAICHER' | 'SOCIAL';
export type StatutAbonne = 'ACTIF' | 'SUSPENDU' | 'CLOTURE';

export interface Abonne {
  id: string;
  organisationId: string;
  forageId: string;
  codeAbonne: string;
  prenom: string;
  nom: string;
  telephone: string;
  quartier: string;
  adresse: string;
  categorie: CategorieAbonne;
  statut: StatutAbonne;
  compteurId?: string;
  dateInscription: string;
  soldeDetteFCFA: number;
}

export interface Compteur {
  id: string;
  organisationId: string;
  forageId: string;
  abonneId?: string;
  numeroSerie: string;
  marque: string;
  diametreMm: number;
  dateInstallation: string;
  statut: 'ACTIF' | 'DEFECTUEUX' | 'REMPLACE';
  dernierIndex: number;
}

export interface Releve {
  id: string;
  organisationId: string;
  forageId: string;
  abonneId: string;
  abonneNom: string;
  compteurId: string;
  dateReleve: string;
  ancienIndex: number;
  nouvelIndex: number;
  consommationM3: number;
  agentId: string;
  agentNom: string;
  statut: 'VALIDE' | 'ANOMALIE_SURCONSOMMATION' | 'ANOMALIE_INDEX_INFERIEUR' | 'CORRIGE';
  motifCorrection?: string;
  photoPreuveUrl?: string;
  factureCreee?: boolean;
}

export type StatutFacture = 'NON_PAYEE' | 'PARTIELLEMENT_PAYEE' | 'PAYEE' | 'EN_RETARD' | 'ANNULEE';

export interface Facture {
  id: string;
  organisationId: string;
  forageId: string;
  abonneId: string;
  abonneCode: string;
  abonneNom: string;
  abonneTel: string;
  abonneQuartier: string;
  numeroFacture: string;
  periode: string; // "Mars 2026"
  dateEmission: string;
  dateEcheance: string;
  ancienIndex: number;
  nouvelIndex: number;
  consommationM3: number;
  prixUnitaireFCFA: number;
  montantConsommationFCFA: number;
  redevanceFixeFCFA: number;
  tvaFCFA: number;
  totalTTCFCFA: number;
  montantPayeFCFA: number;
  resteDuFCFA: number;
  statut: StatutFacture;
  qrCodeData: string;
}

export type ModePaiement = 'WAVE' | 'ORANGE_MONEY' | 'PAYDUNYA' | 'ESPECES' | 'VIREMENT_BANCAIRE';

export interface Paiement {
  id: string;
  organisationId: string;
  forageId: string;
  factureId: string;
  numeroFacture: string;
  abonneId: string;
  abonneNom: string;
  montantFCFA: number;
  datePaiement: string;
  modePaiement: ModePaiement;
  referenceTransaction: string;
  recuNumero: string;
  encaisseParId: string;
  encaisseParNom: string;
  statut: 'CONFIRME' | 'EN_ATTENTE' | 'ECHOUE';
  idempotencyKey: string;
}

export type CompteTresorerieType = 'ESPECES' | 'MOBILE_MONEY' | 'BANQUE';

export interface CompteTresorerie {
  id: string;
  organisationId: string;
  type: CompteTresorerieType;
  nom: string;
  soldeActuelFCFA: number;
  numeroCompte?: string;
}

export type CategorieDepense =
  | 'CARBURANT'
  | 'ELECTRICITE'
  | 'REPARATION'
  | 'SALAIRE'
  | 'ENTRETIEN'
  | 'REDEVANCE'
  | 'AUTRE';

export interface Depense {
  id: string;
  organisationId: string;
  forageId?: string;
  categorie: CategorieDepense;
  description: string;
  montantFCFA: number;
  dateDepense: string;
  compteTresorerieId: string;
  compteNom: string;
  justificatifUrl?: string;
  statut: 'EN_ATTENTE' | 'VALIDEE' | 'ANNULEE';
  creeParId: string;
  creeParNom: string;
  valideParId?: string;
  valideParNom?: string;
  dateValidation?: string;
  motifAnnulation?: string;
}

export interface MouvementTresorerie {
  id: string;
  organisationId: string;
  type: 'ENCAISSEMENT' | 'DECAISSEMENT' | 'TRANSFERT_INTERNE' | 'AJUSTEMENT';
  compteSourceId?: string;
  compteDestId?: string;
  montantFCFA: number;
  dateMouvement: string;
  libelle: string;
  referenceDoc: string;
}

export interface BorneFontaine {
  id: string;
  organisationId: string;
  forageId: string;
  code: string;
  nom: string;
  quartier: string;
  fontainierId?: string;
  fontainierNom?: string;
  prixBassineFCFA: number;
  volumeBassineLitres: number;
  statut: 'ACTIF' | 'EN_PANNE' | 'INACTIF';
}

export interface VenteBorne {
  id: string;
  organisationId: string;
  borneId: string;
  borneNom: string;
  dateVente: string;
  quantiteBassines: number;
  totalVenteFCFA: number;
  fontainierId: string;
  fontainierNom: string;
}

export interface VersementFontainier {
  id: string;
  organisationId: string;
  borneId: string;
  borneNom: string;
  fontainierId: string;
  fontainierNom: string;
  dateVersement: string;
  montantVerseFCFA: number;
  recuNumero: string;
  recuParNom: string;
  statut: 'VALIDE' | 'PARTIEL';
}

export interface ReleveProduction {
  id: string;
  organisationId: string;
  forageId: string;
  forageNom: string;
  dateReleve: string;
  ancienIndexM3: number;
  nouvelIndexM3: number;
  volumeProduitM3: number;
  agentNom: string;
}

export type GravitePanne = 'HAUTE' | 'MOYENNE' | 'BASSE';
export type StatutPanne = 'SIGNALE' | 'EN_COURS' | 'REPARE';

export interface Panne {
  id: string;
  organisationId: string;
  forageId: string;
  forageNom: string;
  titre: string;
  description: string;
  gravite: GravitePanne;
  statut: StatutPanne;
  signalePar: string;
  dateSignalement: string;
  technicienAssigne?: string;
  dateResolution?: string;
  coutReparationFCFA?: number;
  depenseId?: string;
}

export interface CoupureProposition {
  id: string;
  organisationId: string;
  forageId: string;
  abonneId: string;
  abonneCode: string;
  abonneNom: string;
  abonneTel: string;
  abonneQuartier: string;
  montantDetteFCFA: number;
  delaiJours: number;
  motif: string;
  dateProposition: string;
  statut: 'PROPOSE' | 'VALIDEE' | 'EFFECTUEE' | 'RETABLIE' | 'REJETEE';
  validePar?: string;
  dateValidation?: string;
  dateRetablissement?: string;
}

export interface Relance {
  id: string;
  organisationId: string;
  abonneId: string;
  abonneNom: string;
  abonneTel: string;
  dateRelance: string;
  canal: 'WHATSAPP' | 'SMS';
  message: string;
  montantReclameFCFA: number;
  statut: 'ENVOYE' | 'ECHOUE';
}

export type SmsNotificationType =
  | 'NOUVELLE_FACTURE'
  | 'COUPURE_IMMINENTE'
  | 'CONFIRMATION_PAIEMENT'
  | 'RELANCE_IMPAYE'
  | 'ALERTE_STOCK_CRITIQUE';

export type SmsDeliveryStatus = 'DELIVRE' | 'EN_COURS' | 'ECHOUE';

export interface SmsNotification {
  id: string;
  organisationId: string;
  destinataireNom: string;
  destinataireTel: string;
  abonneId?: string;
  type: SmsNotificationType;
  message: string;
  dateEnvoi: string;
  statut: SmsDeliveryStatus;
  coutFCFA: number;
  referencePasserelle: string;
  factureId?: string;
  coupureId?: string;
}

export interface PushNotificationForageConfig {
  activerPushNiveauBas: boolean;
  seuilAlertePourcent: number; // Seuil d'alerte bas en pourcentage (ex: 25%)
  seuilCritiqueArretPourcent: number; // Seuil d'arrêt d'urgence sécurité pompe (ex: 15%)
  forageCibleId: string; // 'ALL' ou ID spécifique d'un forage
  destinatairesRoles: UserRole[]; // Rôles recevant l'alerte push
  frequenceRepetitionMinutes: number; // 0 = immédiat une fois, 15, 30, 60 min
  sonAlerteActive: boolean; // Signal sonore d'urgence
  vibreurMobileActive: boolean; // Vibreur sur smartphone PWA
  doublerSmsUrgenceTechnicien: boolean; // Alerte SMS de secours vers l'astreinte
  telephoneAstreinteTechnique: string;
}

export interface SmsGatewayConfig {
  provider: 'ORANGE_SENEGAL' | 'TWILIO' | 'INTOUCH' | 'SIMULATEUR';
  senderId: string;
  autoSendNouvelleFacture: boolean;
  autoSendCoupureImminente: boolean;
  autoSendPaiement: boolean;
  soldeCreditsSMS: number;
  delaiPreavisHeures: number;
  templateNouvelleFacture: string;
  templateCoupureImminente: string;
  templateConfirmationPaiement: string;
  timingEnvoiFacture: 'IMMEDIAT' | 'DEB_MOIS' | 'DIFFERE_24H';
  seuilMinimumFactureFCFA: number;
  activerRappelUltime: boolean;
  rappelUltimeHeures: number;
  contactReclamationTel: string;
  pushForageConfig?: PushNotificationForageConfig;
}

export interface JournalAudit {
  id: string;
  organisationId?: string;
  timestamp: string;
  userId: string;
  userNom: string;
  userRole: UserRole;
  action: string;
  module: string;
  entiteId?: string;
  details: string;
  ip: string;
  statut: 'SUCCES' | 'REFUS_SECURITE';
}

export type CategorieArticleStock = 'CHLORE' | 'PIECE_DETACHEE' | 'COMPTEUR_NEUF' | 'CARBURANT' | 'CONSOMMABLE';
export type StatutNiveauStock = 'NORMAL' | 'ALERTE' | 'CRITIQUE' | 'RUPTURE';

export interface StockItem {
  id: string;
  organisationId: string;
  forageId?: string;
  forageNom?: string;
  code: string;
  nom: string;
  description: string;
  categorie: CategorieArticleStock;
  quantiteActuelle: number;
  unite: string; // 'kg', 'unités', 'litres', 'sacs'
  seuilAlerte: number;
  seuilCritique: number;
  delaiLivraisonJours: number;
  fournisseurNom: string;
  fournisseurContact: string;
  emplacement: string;
  notificationActive: boolean;
  destinataireAlerte: string;
  derniereMiseAJour: string;
  derniereAlerteDate?: string;
}

export interface MouvementStock {
  id: string;
  stockId: string;
  articleNom: string;
  type: 'ENTREE' | 'SORTIE' | 'AJUSTEMENT';
  quantite: number;
  quantiteApres: number;
  date: string;
  motif: string;
  responsableNom: string;
  referenceBon?: string;
}

export interface AlerteStockNotification {
  id: string;
  stockId: string;
  articleNom: string;
  categorie: CategorieArticleStock;
  niveau: 'ALERTE' | 'CRITIQUE' | 'RUPTURE';
  message: string;
  date: string;
  quantite: number;
  seuilCritique: number;
  unite: string;
  statut: 'ENVOYEE' | 'TRAITEE';
  destinataireTel: string;
}
