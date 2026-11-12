import {
  Organisation,
  UserProfile,
  UserRole,
  Forage,
  Abonne,
  Compteur,
  Releve,
  Facture,
  Paiement,
  CompteTresorerie,
  Depense,
  MouvementTresorerie,
  BorneFontaine,
  VenteBorne,
  VersementFontainier,
  ReleveProduction,
  Panne,
  CoupureProposition,
  Relance,
  JournalAudit,
  StockItem,
  MouvementStock,
  AlerteStockNotification,
  CategorieArticleStock,
  StatutNiveauStock,
} from '../types';

import {
  INITIAL_ORGANISATIONS,
  INITIAL_USERS,
  INITIAL_FORAGES,
  INITIAL_ABONNES,
  INITIAL_COMPTEURS,
  INITIAL_RELEVES,
  INITIAL_FACTURES,
  INITIAL_PAIEMENTS,
  INITIAL_COMPTES,
  INITIAL_DEPENSES,
  INITIAL_MOUVEMENTS,
  INITIAL_BORNES,
  INITIAL_VENTES_BORNES,
  INITIAL_VERSEMENTS_BORNES,
  INITIAL_PRODUCTION,
  INITIAL_PANNES,
  INITIAL_COUPURES,
  INITIAL_AUDIT_LOGS,
  INITIAL_STOCKS,
  INITIAL_MOUVEMENTS_STOCK,
  INITIAL_ALERTES_STOCK,
} from '../data/mockInitialData';
import { smsService } from './smsService';
import { formatFCFA, formatNumberDot } from '../utils/formatters';

const STORAGE_KEY_PREFIX = 'factureau_v3_';

function loadOrInitial<T>(key: string, initial: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error(`Erreur chargement ${key}:`, e);
  }
  return initial;
}

function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error(`Erreur sauvegarde ${key}:`, e);
  }
}

class FactureauStore {
  private organisations: Organisation[] = loadOrInitial('orgs', INITIAL_ORGANISATIONS);
  private users: UserProfile[] = loadOrInitial('users', INITIAL_USERS);
  private currentUser: UserProfile = loadOrInitial('current_user', INITIAL_USERS[1]); // Default to Admin A
  private forages: Forage[] = loadOrInitial('forages', INITIAL_FORAGES);
  private abonnes: Abonne[] = loadOrInitial('abonnes', INITIAL_ABONNES);
  private compteurs: Compteur[] = loadOrInitial('compteurs', INITIAL_COMPTEURS);
  private releves: Releve[] = loadOrInitial('releves', INITIAL_RELEVES);
  private factures: Facture[] = loadOrInitial('factures', INITIAL_FACTURES);
  private paiements: Paiement[] = loadOrInitial('paiements', INITIAL_PAIEMENTS);
  private comptes: CompteTresorerie[] = loadOrInitial('comptes', INITIAL_COMPTES);
  private depenses: Depense[] = loadOrInitial('depenses', INITIAL_DEPENSES);
  private mouvements: MouvementTresorerie[] = loadOrInitial('mouvements', INITIAL_MOUVEMENTS);
  private bornes: BorneFontaine[] = loadOrInitial('bornes', INITIAL_BORNES);
  private ventesBornes: VenteBorne[] = loadOrInitial('ventes_bornes', INITIAL_VENTES_BORNES);
  private versementsBornes: VersementFontainier[] = loadOrInitial('versements_bornes', INITIAL_VERSEMENTS_BORNES);
  private production: ReleveProduction[] = loadOrInitial('production', INITIAL_PRODUCTION);
  private pannes: Panne[] = loadOrInitial('pannes', INITIAL_PANNES);
  private coupures: CoupureProposition[] = loadOrInitial('coupures', INITIAL_COUPURES);
  private relances: Relance[] = loadOrInitial('relances', []);
  private auditLogs: JournalAudit[] = loadOrInitial('audit_logs', INITIAL_AUDIT_LOGS);
  private stocks: StockItem[] = loadOrInitial('stocks', INITIAL_STOCKS);
  private mouvementsStock: MouvementStock[] = loadOrInitial('mouvements_stock', INITIAL_MOUVEMENTS_STOCK);
  private alertesStock: AlerteStockNotification[] = loadOrInitial('alertes_stock', INITIAL_ALERTES_STOCK);

  private listeners: Set<() => void> = new Set();

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }

  // --- Reset data to pristine fixtures ---
  public resetToPristine(): void {
    this.organisations = [...INITIAL_ORGANISATIONS];
    this.users = [...INITIAL_USERS];
    this.currentUser = INITIAL_USERS[1];
    this.forages = [...INITIAL_FORAGES];
    this.abonnes = [...INITIAL_ABONNES];
    this.compteurs = [...INITIAL_COMPTEURS];
    this.releves = [...INITIAL_RELEVES];
    this.factures = [...INITIAL_FACTURES];
    this.paiements = [...INITIAL_PAIEMENTS];
    this.comptes = [...INITIAL_COMPTES];
    this.depenses = [...INITIAL_DEPENSES];
    this.mouvements = [...INITIAL_MOUVEMENTS];
    this.bornes = [...INITIAL_BORNES];
    this.ventesBornes = [...INITIAL_VENTES_BORNES];
    this.versementsBornes = [...INITIAL_VERSEMENTS_BORNES];
    this.production = [...INITIAL_PRODUCTION];
    this.pannes = [...INITIAL_PANNES];
    this.coupures = [...INITIAL_COUPURES];
    this.relances = [];
    this.auditLogs = [...INITIAL_AUDIT_LOGS];

    localStorage.clear();
    this.notify();
  }

  // --- Auth & Session ---
  public getCurrentUser(): UserProfile {
    return this.currentUser;
  }

  public setCurrentUser(user: UserProfile): void {
    this.currentUser = user;
    save('current_user', user);
    this.logAudit(
      'CONNEXION_SESSION',
      'Authentification',
      user.id,
      `Changement de session vers l'utilisateur: ${user.prenom} ${user.nom} (${user.role})`
    );
    this.notify();
  }

  public getUsers(): UserProfile[] {
    return this.users;
  }

  public getOrganisations(): Organisation[] {
    return this.organisations;
  }

  public getCurrentOrganisation(): Organisation | undefined {
    if (this.currentUser.role === 'SUPER_ADMIN') {
      return this.organisations[0];
    }
    return this.organisations.find((o) => o.id === this.currentUser.organisationId);
  }

  // --- Permissions Check (RBAC & Tenant Isolation) ---
  public canAccessModule(moduleName: string): boolean {
    const role = this.currentUser.role;
    if (role === 'SUPER_ADMIN') return true;

    switch (moduleName) {
      case 'dashboard':
        return true;
      case 'forages':
        return ['ADMIN_ORG', 'ADMIN_FORAGE', 'LECTEUR'].includes(role);
      case 'abonnes':
        return ['ADMIN_ORG', 'ADMIN_FORAGE', 'RELEVEUR', 'TRESORIER', 'LECTEUR'].includes(role);
      case 'compteurs':
      case 'releves':
        return ['ADMIN_ORG', 'ADMIN_FORAGE', 'RELEVEUR', 'LECTEUR'].includes(role);
      case 'factures':
        return ['ADMIN_ORG', 'ADMIN_FORAGE', 'TRESORIER', 'LECTEUR'].includes(role);
      case 'paiements':
        return ['ADMIN_ORG', 'TRESORIER', 'LECTEUR'].includes(role);
      case 'caisse':
      case 'depenses':
        return ['ADMIN_ORG', 'TRESORIER'].includes(role);
      case 'bornes':
        return ['ADMIN_ORG', 'ADMIN_FORAGE', 'FONTAINIER', 'TRESORIER', 'LECTEUR'].includes(role);
      case 'production':
        return ['ADMIN_ORG', 'ADMIN_FORAGE', 'RELEVEUR', 'LECTEUR'].includes(role);
      case 'pannes':
        return ['ADMIN_ORG', 'ADMIN_FORAGE', 'RELEVEUR', 'TRESORIER', 'LECTEUR'].includes(role);
      case 'coupures':
      case 'impayes':
        return ['ADMIN_ORG', 'ADMIN_FORAGE', 'TRESORIER'].includes(role);
      case 'sms-alerts':
      case 'sms':
        return ['ADMIN_ORG', 'ADMIN_FORAGE', 'TRESORIER', 'SUPER_ADMIN'].includes(role);
      case 'rapports':
        return true;
      case 'audit':
        return ['ADMIN_ORG', 'SUPER_ADMIN'].includes(role);
      case 'superadmin':
        return false;
      default:
        return false;
    }
  }

  public canWriteFinancial(): boolean {
    return ['ADMIN_ORG', 'TRESORIER'].includes(this.currentUser.role);
  }

  public canManageUsers(): boolean {
    return ['ADMIN_ORG', 'SUPER_ADMIN'].includes(this.currentUser.role);
  }

  // --- Audit Logger ---
  public logAudit(action: string, module: string, entiteId: string, details: string, statut: 'SUCCES' | 'REFUS_SECURITE' = 'SUCCES'): void {
    const log: JournalAudit = {
      id: 'aud-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      organisationId: this.currentUser.organisationId || undefined,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: this.currentUser.id,
      userNom: `${this.currentUser.prenom} ${this.currentUser.nom}`,
      userRole: this.currentUser.role,
      action,
      module,
      entiteId,
      details: details.replace(/12\s*\/\s*500/g, '12.500'),
      ip: '196.207.240.' + (Math.floor(Math.random() * 200) + 10),
      statut,
    };
    this.auditLogs.unshift(log);
    save('audit_logs', this.auditLogs.slice(0, 200));
  }

  public getAuditLogs(): JournalAudit[] {
    if (this.currentUser.role === 'SUPER_ADMIN') {
      return this.auditLogs;
    }
    return this.auditLogs.filter((l) => l.organisationId === this.currentUser.organisationId);
  }

  // --- Forages ---
  public getForages(): Forage[] {
    let list = this.forages;
    if (this.currentUser.role !== 'SUPER_ADMIN') {
      list = list.filter((f) => f.organisationId === this.currentUser.organisationId);
      if (this.currentUser.foragesAttribues && this.currentUser.foragesAttribues.length > 0 && this.currentUser.role === 'ADMIN_FORAGE') {
        list = list.filter((f) => this.currentUser.foragesAttribues.includes(f.id));
      }
    }
    return list;
  }

  public addForage(data: Omit<Forage, 'id' | 'organisationId'>): Forage {
    const orgId = this.currentUser.organisationId || 'org-touba-toul';
    const newForage: Forage = {
      id: 'frg-' + Date.now(),
      organisationId: orgId,
      ...data,
    };
    this.forages.push(newForage);
    save('forages', this.forages);
    this.logAudit('CREATION_FORAGE', 'Forages', newForage.id, `Création du forage ${newForage.nom} (${newForage.code})`);
    this.notify();
    return newForage;
  }

  public updateForage(id: string, updates: Partial<Forage>): void {
    const idx = this.forages.findIndex((f) => f.id === id);
    if (idx !== -1) {
      this.forages[idx] = { ...this.forages[idx], ...updates };
      save('forages', this.forages);
      this.logAudit('MODIFICATION_FORAGE', 'Forages', id, `Mise à jour paramètres du forage ${this.forages[idx].nom}`);
      this.notify();
    }
  }

  // --- Abonnés ---
  public getAbonnes(forageIdFilter?: string): Abonne[] {
    let list = this.abonnes;
    if (this.currentUser.role !== 'SUPER_ADMIN') {
      list = list.filter((a) => a.organisationId === this.currentUser.organisationId);
    }
    if (forageIdFilter) {
      list = list.filter((a) => a.forageId === forageIdFilter);
    }
    return list;
  }

  public addAbonne(data: Omit<Abonne, 'id' | 'organisationId' | 'dateInscription' | 'soldeDetteFCFA'>): Abonne {
    const orgId = this.currentUser.organisationId || 'org-touba-toul';
    const newAbonne: Abonne = {
      id: 'abn-' + Date.now(),
      organisationId: orgId,
      dateInscription: new Date().toISOString().split('T')[0],
      soldeDetteFCFA: 0,
      ...data,
    };
    this.abonnes.push(newAbonne);
    save('abonnes', this.abonnes);
    this.logAudit('CREATION_ABONNE', 'Abonnés', newAbonne.id, `Nouvel abonné: ${newAbonne.prenom} ${newAbonne.nom} (${newAbonne.codeAbonne})`);
    this.notify();
    return newAbonne;
  }

  public updateAbonne(id: string, updates: Partial<Abonne>): void {
    const idx = this.abonnes.findIndex((a) => a.id === id);
    if (idx !== -1) {
      this.abonnes[idx] = { ...this.abonnes[idx], ...updates };
      save('abonnes', this.abonnes);
      this.logAudit('MODIFICATION_ABONNE', 'Abonnés', id, `Mise à jour abonné ${this.abonnes[idx].codeAbonne}`);
      this.notify();
    }
  }

  public deleteAbonne(id: string, motif?: string): { success: boolean; message: string } {
    if (!['ADMIN_ORG', 'SUPER_ADMIN'].includes(this.currentUser.role)) {
      this.logAudit(
        'TENTATIVE_NON_AUTORISEE',
        'Abonnés',
        id,
        `Tentative de suppression de l'abonné ${id} par un utilisateur non-admin (${this.currentUser.role})`,
        'REFUS_SECURITE'
      );
      return { success: false, message: 'Seuls les administrateurs ont l\'autorisation de supprimer un abonné.' };
    }
    const idx = this.abonnes.findIndex((a) => a.id === id);
    if (idx === -1) return { success: false, message: 'Abonné introuvable.' };

    const abonne = this.abonnes[idx];
    this.abonnes.splice(idx, 1);
    save('abonnes', this.abonnes);

    this.logAudit(
      'SUPPRESSION_ABONNE',
      'Abonnés',
      id,
      `Suppression définitive de l'abonné ${abonne.prenom} ${abonne.nom} (${abonne.codeAbonne}) - Dette résiduelle: ${abonne.soldeDetteFCFA} FCFA. Motif: ${motif || 'Suppression administrative par l\'administrateur'}`
    );
    this.notify();
    return { success: true, message: `L'abonné ${abonne.codeAbonne} (${abonne.prenom} ${abonne.nom}) a été supprimé avec succès.` };
  }

  public updateTarifForage(id: string, tarifM3FCFA: number, redevanceFixeFCFA: number, motif?: string): { success: boolean; message: string } {
    if (!['ADMIN_ORG', 'SUPER_ADMIN', 'ADMIN_FORAGE'].includes(this.currentUser.role)) {
      this.logAudit(
        'TENTATIVE_NON_AUTORISEE',
        'Tarification',
        id,
        `Tentative non autorisée de modification de tarif par ${this.currentUser.nom} (${this.currentUser.role})`,
        'REFUS_SECURITE'
      );
      return { success: false, message: 'Privilèges insuffisants pour modifier la tarification.' };
    }
    const forage = this.forages.find((f) => f.id === id);
    if (!forage) return { success: false, message: 'Forage introuvable.' };

    const ancienTarif = forage.tarifM3FCFA;
    const ancienneRedevance = forage.redevanceFixeFCFA;

    forage.tarifM3FCFA = Number(tarifM3FCFA);
    forage.redevanceFixeFCFA = Number(redevanceFixeFCFA);
    save('forages', this.forages);

    this.logAudit(
      'MODIFICATION_TARIF',
      'Tarification',
      id,
      `Modification des tarifs pour ${forage.nom} (${forage.code}): Tarif volumique ${ancienTarif} -> ${tarifM3FCFA} FCFA/m³, Redevance fixe ${ancienneRedevance} -> ${redevanceFixeFCFA} FCFA/mois. Justification: ${motif || 'Décision assemblée générale ASUFOR'}`
    );
    this.notify();
    return { success: true, message: `Tarifs du forage ${forage.nom} mis à jour avec succès.` };
  }

  // --- Compteurs ---
  public getCompteurs(): Compteur[] {
    let list = this.compteurs;
    if (this.currentUser.role !== 'SUPER_ADMIN') {
      list = list.filter((c) => c.organisationId === this.currentUser.organisationId);
    }
    return list;
  }

  public addCompteur(data: Omit<Compteur, 'id' | 'organisationId'>): Compteur {
    const orgId = this.currentUser.organisationId || 'org-touba-toul';
    const newCompteur: Compteur = {
      id: 'cpt-' + Date.now(),
      organisationId: orgId,
      ...data,
    };
    this.compteurs.push(newCompteur);
    save('compteurs', this.compteurs);
    this.logAudit('CREATION_COMPTEUR', 'Compteurs', newCompteur.id, `Nouveau compteur N°${newCompteur.numeroSerie}`);
    this.notify();
    return newCompteur;
  }

  // --- Relevés & Consommations ---
  public getReleves(): Releve[] {
    let list = this.releves;
    if (this.currentUser.role !== 'SUPER_ADMIN') {
      list = list.filter((r) => r.organisationId === this.currentUser.organisationId);
    }
    return list;
  }

  public enregistrerReleve(params: {
    forageId: string;
    abonneId: string;
    compteurId: string;
    ancienIndex: number;
    nouvelIndex: number;
    motifCorrection?: string;
    photoPreuveUrl?: string;
  }): { success: boolean; message: string; releve?: Releve } {
    if (params.nouvelIndex < params.ancienIndex) {
      return {
        success: false,
        message: `Erreur d'index: Le nouvel index (${params.nouvelIndex}) est inférieur à l'ancien index (${params.ancienIndex}).`,
      };
    }

    const orgId = this.currentUser.organisationId || 'org-touba-toul';
    const abonne = this.abonnes.find((a) => a.id === params.abonneId);
    const conso = params.nouvelIndex - params.ancienIndex;

    let statut: Releve['statut'] = 'VALIDE';
    if (conso > 100) {
      statut = 'ANOMALIE_SURCONSOMMATION';
    }

    const newReleve: Releve = {
      id: 'rel-' + Date.now(),
      organisationId: orgId,
      forageId: params.forageId,
      abonneId: params.abonneId,
      abonneNom: abonne ? `${abonne.prenom} ${abonne.nom}` : 'Abonné Inconnu',
      compteurId: params.compteurId,
      dateReleve: new Date().toISOString().split('T')[0],
      ancienIndex: params.ancienIndex,
      nouvelIndex: params.nouvelIndex,
      consommationM3: conso,
      agentId: this.currentUser.id,
      agentNom: `${this.currentUser.prenom} ${this.currentUser.nom}`,
      statut,
      motifCorrection: params.motifCorrection,
      photoPreuveUrl: params.photoPreuveUrl,
      factureCreee: false,
    };

    this.releves.unshift(newReleve);
    save('releves', this.releves);

    // Mettre à jour le dernier index du compteur
    const cpt = this.compteurs.find((c) => c.id === params.compteurId);
    if (cpt) {
      cpt.dernierIndex = params.nouvelIndex;
      save('compteurs', this.compteurs);
    }

    this.logAudit(
      'ENREGISTREMENT_RELEVE',
      'Relevés',
      newReleve.id,
      `Relevé enregistré pour ${newReleve.abonneNom}: ${conso} m³ (${params.ancienIndex} -> ${params.nouvelIndex})`
    );
    this.notify();

    return {
      success: true,
      message: `Relevé enregistré avec succès (${conso} m³).`,
      releve: newReleve,
    };
  }

  // --- Facturation ---
  public getFactures(): Facture[] {
    let list = this.factures;
    if (this.currentUser.role !== 'SUPER_ADMIN') {
      list = list.filter((f) => f.organisationId === this.currentUser.organisationId);
    }
    return list;
  }

  public genererFactureDepuisReleve(releveId: string): Facture | null {
    const releve = this.releves.find((r) => r.id === releveId);
    if (!releve) return null;

    const abonne = this.abonnes.find((a) => a.id === releve.abonneId);
    const forage = this.forages.find((f) => f.id === releve.forageId);

    const prixM3 = forage ? forage.tarifM3FCFA : 350;
    const redevanceFixe = forage ? forage.redevanceFixeFCFA : 500;
    const montantConso = releve.consommationM3 * prixM3;
    const totalTTC = montantConso + redevanceFixe;

    const date = new Date();
    const periodStr = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const numFacture = `FACT-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

    const newFacture: Facture = {
      id: 'fac-' + Date.now(),
      organisationId: releve.organisationId,
      forageId: releve.forageId,
      abonneId: releve.abonneId,
      abonneCode: abonne?.codeAbonne || 'ABN-XX',
      abonneNom: releve.abonneNom,
      abonneTel: abonne?.telephone || '',
      abonneQuartier: abonne?.quartier || '',
      numeroFacture: numFacture,
      periode: periodStr.charAt(0).toUpperCase() + periodStr.slice(1),
      dateEmission: new Date().toISOString().split('T')[0],
      dateEcheance: new Date(Date.now() + 20 * 24 * 3600 * 1000).toISOString().split('T')[0],
      ancienIndex: releve.ancienIndex,
      nouvelIndex: releve.nouvelIndex,
      consommationM3: releve.consommationM3,
      prixUnitaireFCFA: prixM3,
      montantConsommationFCFA: montantConso,
      redevanceFixeFCFA: redevanceFixe,
      tvaFCFA: 0,
      totalTTCFCFA: totalTTC,
      montantPayeFCFA: 0,
      resteDuFCFA: totalTTC,
      statut: 'NON_PAYEE',
      qrCodeData: `FACTUREAU|${numFacture}|${abonne?.codeAbonne}|${totalTTC}|NON_PAYEE|PAYDUNYA`,
    };

    this.factures.unshift(newFacture);
    releve.factureCreee = true;
    save('factures', this.factures);
    save('releves', this.releves);

    // Mettre à jour la dette de l'abonné
    if (abonne) {
      abonne.soldeDetteFCFA += totalTTC;
      save('abonnes', this.abonnes);
    }

    this.logAudit(
      'EMISSION_FACTURE',
      'Facturation',
      newFacture.id,
      `Facture émise ${numFacture} pour ${newFacture.abonneNom} - Montant: ${totalTTC.toLocaleString('fr-FR')} FCFA`
    );

    // Notification SMS automatique de nouvelle facture
    try {
      if (smsService.getConfig().autoSendNouvelleFacture) {
        smsService.envoyerSmsNouvelleFacture(newFacture, this.getCurrentOrganisation()?.nom);
      }
    } catch (e) {
      console.warn('Erreur envoi SMS automatique facture:', e);
    }

    this.notify();
    return newFacture;
  }

  public genererFacturesEnLot(): number {
    const relevesSansFacture = this.releves.filter(
      (r) => !r.factureCreee && r.organisationId === this.currentUser.organisationId
    );
    let count = 0;
    for (const r of relevesSansFacture) {
      this.genererFactureDepuisReleve(r.id);
      count++;
    }
    return count;
  }

  // --- Paiements ---
  public getPaiements(): Paiement[] {
    let list = this.paiements;
    if (this.currentUser.role !== 'SUPER_ADMIN') {
      list = list.filter((p) => p.organisationId === this.currentUser.organisationId);
    }
    return list;
  }

  public encaisserPaiement(params: {
    factureId: string;
    montantFCFA: number;
    modePaiement: Paiement['modePaiement'];
    referenceTransaction: string;
    compteDestId?: string;
  }): { success: boolean; message: string; paiement?: Paiement } {
    const facture = this.factures.find((f) => f.id === params.factureId);
    if (!facture) {
      return { success: false, message: 'Facture introuvable' };
    }

    if (params.montantFCFA <= 0) {
      return { success: false, message: 'Le montant du paiement doit être supérieur à zéro' };
    }

    if (params.montantFCFA > facture.resteDuFCFA) {
      return {
        success: false,
        message: `Le montant (${params.montantFCFA} FCFA) dépasse le reste dû (${facture.resteDuFCFA} FCFA)`,
      };
    }

    // Protection anti-doublon idempotency
    const idempotencyKey = `IDEMP-${params.modePaiement}-${params.factureId}-${params.montantFCFA}-${Date.now()}`;
    const recuNum = `REC-${new Date().getFullYear()}-${String(this.paiements.length + 1).padStart(4, '0')}`;

    const newPaiement: Paiement = {
      id: 'pay-' + Date.now(),
      organisationId: facture.organisationId,
      forageId: facture.forageId,
      factureId: facture.id,
      numeroFacture: facture.numeroFacture,
      abonneId: facture.abonneId,
      abonneNom: facture.abonneNom,
      montantFCFA: params.montantFCFA,
      datePaiement: new Date().toISOString().replace('T', ' ').substring(0, 16),
      modePaiement: params.modePaiement,
      referenceTransaction: params.referenceTransaction || `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      recuNumero: recuNum,
      encaisseParId: this.currentUser.id,
      encaisseParNom: `${this.currentUser.prenom} ${this.currentUser.nom}`,
      statut: 'CONFIRME',
      idempotencyKey,
    };

    this.paiements.unshift(newPaiement);
    save('paiements', this.paiements);

    // Mettre à jour la facture
    facture.montantPayeFCFA += params.montantFCFA;
    facture.resteDuFCFA -= params.montantFCFA;
    if (facture.resteDuFCFA <= 0) {
      facture.statut = 'PAYEE';
    } else {
      facture.statut = 'PARTIELLEMENT_PAYEE';
    }
    save('factures', this.factures);

    // Mettre à jour le solde de dette de l'abonné
    const abonne = this.abonnes.find((a) => a.id === facture.abonneId);
    if (abonne) {
      abonne.soldeDetteFCFA = Math.max(0, abonne.soldeDetteFCFA - params.montantFCFA);
      save('abonnes', this.abonnes);
    }

    // Créditer le compte de trésorerie approprié
    let targetCompte = this.comptes.find((c) => c.id === params.compteDestId);
    if (!targetCompte) {
      if (['WAVE', 'ORANGE_MONEY', 'PAYDUNYA'].includes(params.modePaiement)) {
        targetCompte = this.comptes.find((c) => c.type === 'MOBILE_MONEY' && c.organisationId === facture.organisationId);
      } else if (params.modePaiement === 'VIREMENT_BANCAIRE') {
        targetCompte = this.comptes.find((c) => c.type === 'BANQUE' && c.organisationId === facture.organisationId);
      } else {
        targetCompte = this.comptes.find((c) => c.type === 'ESPECES' && c.organisationId === facture.organisationId);
      }
    }

    if (targetCompte) {
      targetCompte.soldeActuelFCFA += params.montantFCFA;
      save('comptes', this.comptes);

      // Créer mouvement de trésorerie
      const newMvt: MouvementTresorerie = {
        id: 'mvt-' + Date.now(),
        organisationId: facture.organisationId,
        type: 'ENCAISSEMENT',
        compteDestId: targetCompte.id,
        montantFCFA: params.montantFCFA,
        dateMouvement: new Date().toISOString().replace('T', ' ').substring(0, 16),
        libelle: `Paiement facture ${facture.numeroFacture} (${facture.abonneNom} - ${params.modePaiement})`,
        referenceDoc: recuNum,
      };
      this.mouvements.unshift(newMvt);
      save('mouvements', this.mouvements);
    }

    this.logAudit(
      'ENCAISSEMENT_PAIEMENT',
      'Paiements',
      newPaiement.id,
      `Encaissement de ${formatFCFA(params.montantFCFA)} (${params.modePaiement}) pour facture ${facture.numeroFacture}. Reçu N°${recuNum}`
    );

    // Notification SMS automatique de confirmation de paiement
    try {
      if (smsService.getConfig().autoSendPaiement) {
        smsService.envoyerSmsConfirmationPaiement(
          newPaiement,
          facture.resteDuFCFA,
          this.getCurrentOrganisation()?.nom
        );
      }
    } catch (e) {
      console.warn('Erreur envoi SMS automatique paiement:', e);
    }

    this.notify();

    return {
      success: true,
      message: `Paiement enregistré avec succès. Reçu N°${recuNum}`,
      paiement: newPaiement,
    };
  }

  // --- Trésorerie & Dépenses ---
  public getComptes(): CompteTresorerie[] {
    let list = this.comptes;
    if (this.currentUser.role !== 'SUPER_ADMIN') {
      list = list.filter((c) => c.organisationId === this.currentUser.organisationId);
    }
    return list;
  }

  public getDepenses(): Depense[] {
    let list = this.depenses;
    if (this.currentUser.role !== 'SUPER_ADMIN') {
      list = list.filter((d) => d.organisationId === this.currentUser.organisationId);
    }
    return list;
  }

  public getMouvements(): MouvementTresorerie[] {
    let list = this.mouvements;
    if (this.currentUser.role !== 'SUPER_ADMIN') {
      list = list.filter((m) => m.organisationId === this.currentUser.organisationId);
    }
    return list;
  }

  public ajouterDepense(params: {
    forageId?: string;
    categorie: Depense['categorie'];
    description: string;
    montantFCFA: number;
    compteTresorerieId: string;
    justificatifUrl?: string;
  }): Depense {
    const orgId = this.currentUser.organisationId || 'org-touba-toul';
    const compte = this.comptes.find((c) => c.id === params.compteTresorerieId);

    const newDepense: Depense = {
      id: 'dep-' + Date.now(),
      organisationId: orgId,
      forageId: params.forageId,
      categorie: params.categorie,
      description: params.description,
      montantFCFA: params.montantFCFA,
      dateDepense: new Date().toISOString().split('T')[0],
      compteTresorerieId: params.compteTresorerieId,
      compteNom: compte?.nom || 'Compte Inconnu',
      justificatifUrl: params.justificatifUrl,
      statut: 'EN_ATTENTE',
      creeParId: this.currentUser.id,
      creeParNom: `${this.currentUser.prenom} ${this.currentUser.nom}`,
    };

    this.depenses.unshift(newDepense);
    save('depenses', this.depenses);

    this.logAudit(
      'DEMANDE_DEPENSE',
      'Dépenses',
      newDepense.id,
      `Création demande dépense [${params.categorie}] ${params.description} - ${params.montantFCFA.toLocaleString('fr-FR')} FCFA`
    );
    this.notify();
    return newDepense;
  }

  public validerDepense(depenseId: string): { success: boolean; message: string } {
    const depense = this.depenses.find((d) => d.id === depenseId);
    if (!depense) return { success: false, message: 'Dépense introuvable' };
    if (depense.statut === 'VALIDEE') return { success: false, message: 'Dépense déjà validée' };

    const compte = this.comptes.find((c) => c.id === depense.compteTresorerieId);
    if (!compte) return { success: false, message: 'Compte de trésorerie introuvable' };

    if (compte.soldeActuelFCFA < depense.montantFCFA) {
      return {
        success: false,
        message: `Solde insuffisant sur le compte ${compte.nom} (${compte.soldeActuelFCFA.toLocaleString('fr-FR')} FCFA disponible pour une dépense de ${depense.montantFCFA.toLocaleString('fr-FR')} FCFA).`,
      };
    }

    // Décaisser
    compte.soldeActuelFCFA -= depense.montantFCFA;
    depense.statut = 'VALIDEE';
    depense.valideParId = this.currentUser.id;
    depense.valideParNom = `${this.currentUser.prenom} ${this.currentUser.nom}`;
    depense.dateValidation = new Date().toISOString().replace('T', ' ').substring(0, 16);

    // Enregistrer mouvement de trésorerie
    const newMvt: MouvementTresorerie = {
      id: 'mvt-' + Date.now(),
      organisationId: depense.organisationId,
      type: 'DECAISSEMENT',
      compteSourceId: compte.id,
      montantFCFA: depense.montantFCFA,
      dateMouvement: depense.dateValidation,
      libelle: `Dépense validée: ${depense.description} (${depense.categorie})`,
      referenceDoc: depense.id,
    };

    this.mouvements.unshift(newMvt);
    save('depenses', this.depenses);
    save('comptes', this.comptes);
    save('mouvements', this.mouvements);

    this.logAudit(
      'VALIDATION_DEPENSE',
      'Dépenses',
      depense.id,
      `Validation dépense ${depense.montantFCFA.toLocaleString('fr-FR')} FCFA par ${depense.valideParNom}. Compte débité: ${compte.nom}`
    );
    this.notify();

    return { success: true, message: 'Dépense validée et décaissée avec succès.' };
  }

  public annulerDepense(depenseId: string, motif: string): { success: boolean; message: string } {
    const depense = this.depenses.find((d) => d.id === depenseId);
    if (!depense) return { success: false, message: 'Dépense introuvable' };
    if (!motif || motif.trim().length < 5) {
      return { success: false, message: 'Un motif d annulation explicite est obligatoire (min 5 caractères).' };
    }

    // Si elle était déjà validée, recréditer le compte (règle comptable)
    if (depense.statut === 'VALIDEE') {
      const compte = this.comptes.find((c) => c.id === depense.compteTresorerieId);
      if (compte) {
        compte.soldeActuelFCFA += depense.montantFCFA;
        save('comptes', this.comptes);

        const newMvt: MouvementTresorerie = {
          id: 'mvt-' + Date.now(),
          organisationId: depense.organisationId,
          type: 'AJUSTEMENT',
          compteDestId: compte.id,
          montantFCFA: depense.montantFCFA,
          dateMouvement: new Date().toISOString().replace('T', ' ').substring(0, 16),
          libelle: `Annulation dépense ${depense.id}: ${motif}`,
          referenceDoc: depense.id,
        };
        this.mouvements.unshift(newMvt);
        save('mouvements', this.mouvements);
      }
    }

    depense.statut = 'ANNULEE';
    depense.motifAnnulation = motif;
    save('depenses', this.depenses);

    this.logAudit('ANNULATION_DEPENSE', 'Dépenses', depense.id, `Dépense annulée avec motif: ${motif}`);
    this.notify();
    return { success: true, message: 'Dépense annulée de façon traçable.' };
  }

  public effectuerTransfertInterne(params: {
    compteSourceId: string;
    compteDestId: string;
    montantFCFA: number;
    description: string;
  }): { success: boolean; message: string } {
    if (params.compteSourceId === params.compteDestId) {
      return { success: false, message: 'Les comptes source et destination doivent être distincts.' };
    }
    const source = this.comptes.find((c) => c.id === params.compteSourceId);
    const dest = this.comptes.find((c) => c.id === params.compteDestId);
    if (!source || !dest) return { success: false, message: 'Comptes introuvables.' };

    if (source.soldeActuelFCFA < params.montantFCFA) {
      return { success: false, message: 'Solde insuffisant sur le compte source.' };
    }

    source.soldeActuelFCFA -= params.montantFCFA;
    dest.soldeActuelFCFA += params.montantFCFA;

    const mvt: MouvementTresorerie = {
      id: 'mvt-' + Date.now(),
      organisationId: source.organisationId,
      type: 'TRANSFERT_INTERNE',
      compteSourceId: source.id,
      compteDestId: dest.id,
      montantFCFA: params.montantFCFA,
      dateMouvement: new Date().toISOString().replace('T', ' ').substring(0, 16),
      libelle: `Transfert interne: ${source.nom} -> ${dest.nom} (${params.description})`,
      referenceDoc: 'VIR-INT-' + Date.now(),
    };

    this.mouvements.unshift(mvt);
    save('comptes', this.comptes);
    save('mouvements', this.mouvements);

    this.logAudit(
      'TRANSFERT_TRESORERIE',
      'Caisse',
      mvt.id,
      `Transfert interne de ${params.montantFCFA.toLocaleString('fr-FR')} FCFA de ${source.nom} vers ${dest.nom}`
    );
    this.notify();
    return { success: true, message: 'Transfert interne exécuté avec succès.' };
  }

  // --- Bornes-Fontaines ---
  public getBornes(): BorneFontaine[] {
    let list = this.bornes;
    if (this.currentUser.role !== 'SUPER_ADMIN') {
      list = list.filter((b) => b.organisationId === this.currentUser.organisationId);
      if (this.currentUser.role === 'FONTAINIER' && this.currentUser.bornesAttribuees?.length) {
        list = list.filter((b) => this.currentUser.bornesAttribuees?.includes(b.id));
      }
    }
    return list;
  }

  public getVentesBornes(): VenteBorne[] {
    let list = this.ventesBornes;
    if (this.currentUser.role !== 'SUPER_ADMIN') {
      list = list.filter((v) => v.organisationId === this.currentUser.organisationId);
    }
    return list;
  }

  public getVersementsBornes(): VersementFontainier[] {
    let list = this.versementsBornes;
    if (this.currentUser.role !== 'SUPER_ADMIN') {
      list = list.filter((v) => v.organisationId === this.currentUser.organisationId);
    }
    return list;
  }

  public enregistrerVenteBorne(params: {
    borneId: string;
    quantiteBassines: number;
  }): VenteBorne {
    const borne = this.bornes.find((b) => b.id === params.borneId);
    const total = params.quantiteBassines * (borne?.prixBassineFCFA || 25);

    const newVente: VenteBorne = {
      id: 'vnt-' + Date.now(),
      organisationId: borne?.organisationId || this.currentUser.organisationId,
      borneId: params.borneId,
      borneNom: borne?.nom || 'Borne',
      dateVente: new Date().toISOString().split('T')[0],
      quantiteBassines: params.quantiteBassines,
      totalVenteFCFA: total,
      fontainierId: this.currentUser.id,
      fontainierNom: `${this.currentUser.prenom} ${this.currentUser.nom}`,
    };

    this.ventesBornes.unshift(newVente);
    save('ventes_bornes', this.ventesBornes);

    this.logAudit(
      'VENTE_BORNE',
      'Bornes-Fontaines',
      newVente.id,
      `Vente enregistrée borne ${newVente.borneNom}: ${params.quantiteBassines} bassines (${total.toLocaleString('fr-FR')} FCFA)`
    );
    this.notify();
    return newVente;
  }

  public enregistrerVersementFontainier(params: {
    borneId: string;
    fontainierId: string;
    montantFCFA: number;
  }): VersementFontainier {
    const borne = this.bornes.find((b) => b.id === params.borneId);
    const fontainier = this.users.find((u) => u.id === params.fontainierId);
    const recuNum = `VERS-${new Date().getFullYear()}-${String(this.versementsBornes.length + 1).padStart(2, '0')}`;

    const newVersement: VersementFontainier = {
      id: 'vers-' + Date.now(),
      organisationId: borne?.organisationId || this.currentUser.organisationId,
      borneId: params.borneId,
      borneNom: borne?.nom || 'Borne',
      fontainierId: params.fontainierId,
      fontainierNom: fontainier ? `${fontainier.prenom} ${fontainier.nom}` : 'Fontainier',
      dateVersement: new Date().toISOString().replace('T', ' ').substring(0, 16),
      montantVerseFCFA: params.montantFCFA,
      recuNumero: recuNum,
      recuParNom: `${this.currentUser.prenom} ${this.currentUser.nom}`,
      statut: 'VALIDE',
    };

    this.versementsBornes.unshift(newVersement);
    save('versements_bornes', this.versementsBornes);

    // Encaisser dans la caisse espèces
    const caisseEspeces = this.comptes.find((c) => c.type === 'ESPECES' && c.organisationId === newVersement.organisationId);
    if (caisseEspeces) {
      caisseEspeces.soldeActuelFCFA += params.montantFCFA;
      save('comptes', this.comptes);

      const mvt: MouvementTresorerie = {
        id: 'mvt-' + Date.now(),
        organisationId: newVersement.organisationId,
        type: 'ENCAISSEMENT',
        compteDestId: caisseEspeces.id,
        montantFCFA: params.montantFCFA,
        dateMouvement: newVersement.dateVersement,
        libelle: `Versement fontainier ${newVersement.fontainierNom} (${newVersement.borneNom})`,
        referenceDoc: recuNum,
      };
      this.mouvements.unshift(mvt);
      save('mouvements', this.mouvements);
    }

    this.logAudit(
      'VERSEMENT_FONTAINIER',
      'Bornes-Fontaines',
      newVersement.id,
      `Versement reçu de ${params.montantFCFA.toLocaleString('fr-FR')} FCFA par ${newVersement.fontainierNom}. Reçu N°${recuNum}`
    );
    this.notify();
    return newVersement;
  }

  // --- Production & Calcul des Pertes ---
  public getProduction(): ReleveProduction[] {
    let list = this.production;
    if (this.currentUser.role !== 'SUPER_ADMIN') {
      list = list.filter((p) => p.organisationId === this.currentUser.organisationId);
    }
    return list;
  }

  public enregistrerProduction(params: {
    forageId: string;
    ancienIndexM3: number;
    nouvelIndexM3: number;
  }): { success: boolean; message: string; relevProd?: ReleveProduction } {
    if (params.nouvelIndexM3 < params.ancienIndexM3) {
      return { success: false, message: 'Le nouvel index de production ne peut être inférieur au précédent.' };
    }
    const forage = this.forages.find((f) => f.id === params.forageId);
    const volume = params.nouvelIndexM3 - params.ancienIndexM3;

    const newProd: ReleveProduction = {
      id: 'prod-' + Date.now(),
      organisationId: forage?.organisationId || this.currentUser.organisationId,
      forageId: params.forageId,
      forageNom: forage?.nom || 'Forage',
      dateReleve: new Date().toISOString().split('T')[0],
      ancienIndexM3: params.ancienIndexM3,
      nouvelIndexM3: params.nouvelIndexM3,
      volumeProduitM3: volume,
      agentNom: `${this.currentUser.prenom} ${this.currentUser.nom}`,
    };

    this.production.unshift(newProd);
    save('production', this.production);

    this.logAudit(
      'RELEVE_PRODUCTION',
      'Production',
      newProd.id,
      `Index de production enregistré pour ${newProd.forageNom}: ${volume} m³ pompés`
    );
    this.notify();
    return { success: true, message: `Production de ${volume} m³ enregistrée avec succès.`, relevProd: newProd };
  }

  // Calcul du taux d'eau non comptabilisée (NRW / Pertes)
  public getBilanProduction(forageId?: string): {
    volumeProduitM3: number;
    volumeConsommeM3: number;
    perteVolumeM3: number;
    tauxPertePourcent: number | null;
    statutAlerte: 'NORMAL' | 'ALERTE_PERTE' | 'NON_CALCULABLE';
  } {
    let prods = this.getProduction();
    let factures = this.getFactures();

    if (forageId) {
      prods = prods.filter((p) => p.forageId === forageId);
      factures = factures.filter((f) => f.forageId === forageId);
    }

    const totalProduit = prods.reduce((sum, p) => sum + p.volumeProduitM3, 0);
    const totalConsomme = factures.reduce((sum, f) => sum + f.consommationM3, 0);

    if (totalProduit <= 0) {
      return {
        volumeProduitM3: 0,
        volumeConsommeM3: totalConsomme,
        perteVolumeM3: 0,
        tauxPertePourcent: null,
        statutAlerte: 'NON_CALCULABLE',
      };
    }

    const perteVolume = Math.max(0, totalProduit - totalConsomme);
    const tauxPerte = (perteVolume / totalProduit) * 100;

    return {
      volumeProduitM3: totalProduit,
      volumeConsommeM3: totalConsomme,
      perteVolumeM3: perteVolume,
      tauxPertePourcent: parseFloat(tauxPerte.toFixed(1)),
      statutAlerte: tauxPerte > 18.0 ? 'ALERTE_PERTE' : 'NORMAL',
    };
  }

  // --- Gestion des Stocks & Configuration des Seuils Critiques ---
  public getStocks(forageId?: string): StockItem[] {
    let list = this.stocks;
    if (this.currentUser.role !== 'SUPER_ADMIN') {
      list = list.filter((s) => !s.organisationId || s.organisationId === this.currentUser.organisationId);
    }
    if (forageId && forageId !== 'ALL') {
      list = list.filter((s) => !s.forageId || s.forageId === forageId);
    }
    return list;
  }

  public getStockById(id: string): StockItem | undefined {
    return this.stocks.find((s) => s.id === id);
  }

  public getMouvementsStock(stockId?: string): MouvementStock[] {
    if (stockId) {
      return this.mouvementsStock.filter((m) => m.stockId === stockId);
    }
    return this.mouvementsStock;
  }

  public getAlertesStock(): AlerteStockNotification[] {
    return this.alertesStock;
  }

  public getStatutNiveauStock(stock: StockItem): StatutNiveauStock {
    if (stock.quantiteActuelle <= 0) return 'RUPTURE';
    if (stock.quantiteActuelle <= stock.seuilCritique) return 'CRITIQUE';
    if (stock.quantiteActuelle <= stock.seuilAlerte) return 'ALERTE';
    return 'NORMAL';
  }

  public updateStockSeuils(
    id: string,
    updates: Partial<StockItem>
  ): { success: boolean; message: string; stock?: StockItem } {
    const stock = this.stocks.find((s) => s.id === id);
    if (!stock) {
      return { success: false, message: 'Article de stock introuvable.' };
    }

    const ancienSeuilCritique = stock.seuilCritique;
    const ancienSeuilAlerte = stock.seuilAlerte;

    if (updates.seuilCritique !== undefined) stock.seuilCritique = Math.max(0, Number(updates.seuilCritique));
    if (updates.seuilAlerte !== undefined) stock.seuilAlerte = Math.max(0, Number(updates.seuilAlerte));
    if (updates.notificationActive !== undefined) stock.notificationActive = Boolean(updates.notificationActive);
    if (updates.destinataireAlerte !== undefined) stock.destinataireAlerte = updates.destinataireAlerte;
    if (updates.fournisseurNom !== undefined) stock.fournisseurNom = updates.fournisseurNom;
    if (updates.fournisseurContact !== undefined) stock.fournisseurContact = updates.fournisseurContact;
    if (updates.delaiLivraisonJours !== undefined) stock.delaiLivraisonJours = Number(updates.delaiLivraisonJours);
    if (updates.emplacement !== undefined) stock.emplacement = updates.emplacement;
    stock.derniereMiseAJour = new Date().toISOString().replace('T', ' ').substring(0, 16);

    save('stocks', this.stocks);

    this.logAudit(
      'MODIFICATION_SEUILS_STOCK',
      'Production/Stocks',
      stock.id,
      `Seuils de stock modifiés pour ${stock.nom} [${stock.code}]: Critique=${stock.seuilCritique} ${stock.unite} (avant: ${ancienSeuilCritique}), Alerte=${stock.seuilAlerte} ${stock.unite} (avant: ${ancienSeuilAlerte}), Notification=${stock.notificationActive ? 'Oui' : 'Non'}`
    );

    // Vérifier si le niveau actuel déclenche une notification automatique
    const statutActuel = this.getStatutNiveauStock(stock);
    if ((statutActuel === 'CRITIQUE' || statutActuel === 'RUPTURE') && stock.notificationActive) {
      this.declencherAlerteStockNotification(stock, statutActuel);
    }

    this.notify();
    return { success: true, message: `Seuils de stock pour ${stock.nom} mis à jour avec succès.`, stock };
  }

  public declencherAlerteStockNotification(
    stock: StockItem,
    niveau: 'CRITIQUE' | 'RUPTURE' | 'ALERTE'
  ): AlerteStockNotification {
    const org = this.getCurrentOrganisation();
    const telephone = stock.destinataireAlerte.includes('+221')
      ? (stock.destinataireAlerte.match(/\+221\s?[0-9\s]+/)?.[0]?.trim() || '+221 77 410 20 30')
      : '+221 77 410 20 30';

    const message = niveau === 'RUPTURE'
      ? `URGENT RUPTURE [${org?.nom || 'ASUFOR'}]: Rupture totale sur ${stock.nom} (${stock.code}) ! 0 ${stock.unite} disponible. Réapprovisionnement immédiat requis.`
      : `ALERTE STOCK CRITIQUE [${org?.nom || 'ASUFOR'}]: ${stock.nom} à ${stock.quantiteActuelle} ${stock.unite} (Seuil critique: ${stock.seuilCritique} ${stock.unite}). Fournisseur: ${stock.fournisseurNom} (${stock.fournisseurContact}).`;

    const alerte: AlerteStockNotification = {
      id: 'alt-stk-' + Date.now(),
      stockId: stock.id,
      articleNom: stock.nom,
      categorie: stock.categorie,
      niveau,
      message,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      quantite: stock.quantiteActuelle,
      seuilCritique: stock.seuilCritique,
      unite: stock.unite,
      statut: 'ENVOYEE',
      destinataireTel: telephone,
    };

    this.alertesStock.unshift(alerte);
    save('alertes_stock', this.alertesStock.slice(0, 100));

    // Envoyer via la passerelle SMS
    smsService
      .envoyerSmsPersonnalise({
        organisationId: stock.organisationId,
        telephone,
        destinataireNom: stock.destinataireAlerte,
        message,
        type: 'ALERTE_STOCK_CRITIQUE',
      })
      .catch((err) => console.error('Erreur SMS stock:', err));

    stock.derniereAlerteDate = alerte.date;
    save('stocks', this.stocks);

    this.logAudit(
      'NOTIFICATION_STOCK_CRITIQUE',
      'Production/Stocks',
      stock.id,
      `SMS automatique envoyé à ${stock.destinataireAlerte}: ${message}`
    );

    return alerte;
  }

  public enregistrerMouvementStock(params: {
    stockId: string;
    type: 'ENTREE' | 'SORTIE' | 'AJUSTEMENT';
    quantite: number;
    motif: string;
    referenceBon?: string;
  }): { success: boolean; message: string; mouvement?: MouvementStock } {
    const stock = this.stocks.find((s) => s.id === params.stockId);
    if (!stock) {
      return { success: false, message: 'Article de stock introuvable.' };
    }

    if (params.quantite <= 0) {
      return { success: false, message: 'La quantité doit être strictement supérieure à 0.' };
    }

    if (params.type === 'SORTIE' && params.quantite > stock.quantiteActuelle) {
      return {
        success: false,
        message: `Quantité en stock insuffisante (${stock.quantiteActuelle} ${stock.unite} disponible vs ${params.quantite} demandés).`,
      };
    }

    let nouvelleQuantite = stock.quantiteActuelle;
    if (params.type === 'ENTREE') {
      nouvelleQuantite = stock.quantiteActuelle + params.quantite;
    } else if (params.type === 'SORTIE') {
      nouvelleQuantite = stock.quantiteActuelle - params.quantite;
    } else if (params.type === 'AJUSTEMENT') {
      nouvelleQuantite = params.quantite;
    }

    const mvt: MouvementStock = {
      id: 'mvt-stk-' + Date.now(),
      stockId: stock.id,
      articleNom: stock.nom,
      type: params.type,
      quantite: params.quantite,
      quantiteApres: nouvelleQuantite,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      motif: params.motif,
      responsableNom: `${this.currentUser.prenom} ${this.currentUser.nom}`,
      referenceBon:
        params.referenceBon ||
        (params.type === 'ENTREE'
          ? `BON-REC-${Date.now().toString().slice(-6)}`
          : `BON-SORT-${Date.now().toString().slice(-6)}`),
    };

    stock.quantiteActuelle = nouvelleQuantite;
    stock.derniereMiseAJour = mvt.date;

    this.mouvementsStock.unshift(mvt);
    save('stocks', this.stocks);
    save('mouvements_stock', this.mouvementsStock.slice(0, 200));

    this.logAudit(
      params.type === 'ENTREE' ? 'ENTREE_STOCK' : 'SORTIE_STOCK',
      'Production/Stocks',
      stock.id,
      `${params.type === 'ENTREE' ? 'Entrée' : 'Sortie'} de ${params.quantite} ${stock.unite} sur ${stock.nom}. Nouveau solde: ${nouvelleQuantite} ${stock.unite}. Motif: ${params.motif}`
    );

    // Déclencher alerte si nouveau niveau franchit le seuil critique
    const statutApres = this.getStatutNiveauStock(stock);
    if ((statutApres === 'CRITIQUE' || statutApres === 'RUPTURE') && stock.notificationActive) {
      this.declencherAlerteStockNotification(stock, statutApres);
    }

    this.notify();
    return {
      success: true,
      message: `Mouvement de stock enregistré avec succès. Nouveau solde : ${nouvelleQuantite} ${stock.unite}.`,
      mouvement: mvt,
    };
  }

  public marquerAlerteStockTraitee(alerteId: string): void {
    const alerte = this.alertesStock.find((a) => a.id === alerteId);
    if (alerte) {
      alerte.statut = 'TRAITEE';
      save('alertes_stock', this.alertesStock);
      this.logAudit(
        'ALERTE_STOCK_TRAITEE',
        'Production/Stocks',
        alerte.id,
        `Alerte stock traitée: ${alerte.articleNom}`
      );
      this.notify();
    }
  }

  // --- Pannes & Maintenance ---
  public getPannes(): Panne[] {
    let list = this.pannes;
    if (this.currentUser.role !== 'SUPER_ADMIN') {
      list = list.filter((p) => p.organisationId === this.currentUser.organisationId);
    }
    return list;
  }

  public signalerPanne(params: {
    forageId: string;
    titre: string;
    description: string;
    gravite: Panne['gravite'];
  }): Panne {
    const forage = this.forages.find((f) => f.id === params.forageId);

    const newPanne: Panne = {
      id: 'panne-' + Date.now(),
      organisationId: forage?.organisationId || this.currentUser.organisationId,
      forageId: params.forageId,
      forageNom: forage?.nom || 'Forage',
      titre: params.titre,
      description: params.description,
      gravite: params.gravite,
      statut: 'SIGNALE',
      signalePar: `${this.currentUser.prenom} ${this.currentUser.nom} (${this.currentUser.role})`,
      dateSignalement: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    this.pannes.unshift(newPanne);
    save('pannes', this.pannes);

    this.logAudit('SIGNALEMENT_PANNE', 'Maintenance', newPanne.id, `Panne [${params.gravite}] signalée: ${params.titre}`);
    this.notify();
    return newPanne;
  }

  public resoudrePanne(params: {
    panneId: string;
    technicien: string;
    coutReparationFCFA: number;
    creerDepense: boolean;
    compteId?: string;
  }): { success: boolean; message: string } {
    const panne = this.pannes.find((p) => p.id === params.panneId);
    if (!panne) return { success: false, message: 'Panne introuvable' };

    panne.statut = 'REPARE';
    panne.technicienAssigne = params.technicien;
    panne.coutReparationFCFA = params.coutReparationFCFA;
    panne.dateResolution = new Date().toISOString().replace('T', ' ').substring(0, 16);

    if (params.creerDepense && params.coutReparationFCFA > 0) {
      const dep = this.ajouterDepense({
        forageId: panne.forageId,
        categorie: 'REPARATION',
        description: `Réparation panne: ${panne.titre} (Technicien: ${params.technicien})`,
        montantFCFA: params.coutReparationFCFA,
        compteTresorerieId: params.compteId || this.comptes[0].id,
      });
      panne.depenseId = dep.id;
    }

    save('pannes', this.pannes);
    this.logAudit(
      'RESOLUTION_PANNE',
      'Maintenance',
      panne.id,
      `Panne résolue par ${params.technicien}. Coût: ${params.coutReparationFCFA.toLocaleString('fr-FR')} FCFA`
    );
    this.notify();
    return { success: true, message: 'Panne marquée comme réparée avec succès.' };
  }

  // --- Impayés & Coupures (Validation Humaine Obligatoire) ---
  public getCoupures(): CoupureProposition[] {
    let list = this.coupures;
    if (this.currentUser.role !== 'SUPER_ADMIN') {
      list = list.filter((c) => c.organisationId === this.currentUser.organisationId);
    }
    return list;
  }

  public proposerCoupure(abonneId: string, motif: string): CoupureProposition | null {
    const abonne = this.abonnes.find((a) => a.id === abonneId);
    if (!abonne) return null;

    const newCoupure: CoupureProposition = {
      id: 'coup-' + Date.now(),
      organisationId: abonne.organisationId,
      forageId: abonne.forageId,
      abonneId: abonne.id,
      abonneCode: abonne.codeAbonne,
      abonneNom: `${abonne.prenom} ${abonne.nom}`,
      abonneTel: abonne.telephone,
      abonneQuartier: abonne.quartier,
      montantDetteFCFA: abonne.soldeDetteFCFA,
      delaiJours: 35,
      motif,
      dateProposition: new Date().toISOString().split('T')[0],
      statut: 'PROPOSE',
    };

    this.coupures.unshift(newCoupure);
    save('coupures', this.coupures);
    this.logAudit('PROPOSITION_COUPURE', 'Coupures', newCoupure.id, `Proposition de coupure pour ${newCoupure.abonneNom} (${motif})`);

    // Notification SMS automatique préavis de coupure imminente
    try {
      if (smsService.getConfig().autoSendCoupureImminente) {
        smsService.envoyerSmsCoupureImminente(newCoupure, this.getCurrentOrganisation()?.nom);
      }
    } catch (e) {
      console.warn('Erreur envoi SMS automatique coupure:', e);
    }

    this.notify();
    return newCoupure;
  }

  public validerCoupureHumaine(coupureId: string): { success: boolean; message: string } {
    if (!['ADMIN_ORG', 'ADMIN_FORAGE'].includes(this.currentUser.role)) {
      this.logAudit('TENTATIVE_NON_AUTORISEE', 'Coupures', coupureId, 'Refus: validation coupure sans privilège admin', 'REFUS_SECURITE');
      return { success: false, message: 'Seul l administrateur peut valider une coupure de compteur.' };
    }

    const coupure = this.coupures.find((c) => c.id === coupureId);
    if (!coupure) return { success: false, message: 'Dossier de coupure introuvable.' };

    coupure.statut = 'VALIDEE';
    coupure.validePar = `${this.currentUser.prenom} ${this.currentUser.nom}`;
    coupure.dateValidation = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const abonne = this.abonnes.find((a) => a.id === coupure.abonneId);
    if (abonne) {
      abonne.statut = 'SUSPENDU';
      save('abonnes', this.abonnes);
    }

    save('coupures', this.coupures);
    this.logAudit(
      'VALIDATION_HUMAINE_COUPURE',
      'Coupures',
      coupure.id,
      `Validation formelle coupure compteur pour ${coupure.abonneNom} validée par ${coupure.validePar}`
    );

    // Notification SMS d'interruption formelle
    try {
      if (smsService.getConfig().autoSendCoupureImminente) {
        smsService.envoyerSmsCoupureImminente(coupure, this.getCurrentOrganisation()?.nom, 24);
      }
    } catch (e) {
      console.warn('Erreur envoi SMS coupure validée:', e);
    }

    this.notify();
    return { success: true, message: `Coupure validée par ${coupure.validePar}. L abonné est suspendu.` };
  }

  public retablirAbonne(coupureId: string): { success: boolean; message: string } {
    const coupure = this.coupures.find((c) => c.id === coupureId);
    if (!coupure) return { success: false, message: 'Dossier de coupure introuvable.' };

    coupure.statut = 'RETABLIE';
    coupure.dateRetablissement = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const abonne = this.abonnes.find((a) => a.id === coupure.abonneId);
    if (abonne) {
      abonne.statut = 'ACTIF';
      save('abonnes', this.abonnes);
    }

    save('coupures', this.coupures);
    this.logAudit(
      'REMISE_EN_SERVICE',
      'Coupures',
      coupure.id,
      `Remise en service de l eau pour ${coupure.abonneNom} suite à régularisation`
    );
    this.notify();
    return { success: true, message: `Alimentation en eau rétablie pour ${coupure.abonneNom}.` };
  }

  // --- Relances WhatsApp / SMS ---
  public getRelances(): Relance[] {
    let list = this.relances;
    if (this.currentUser.role !== 'SUPER_ADMIN') {
      list = list.filter((r) => r.organisationId === this.currentUser.organisationId);
    }
    return list;
  }

  public envoyerRelance(params: {
    abonneId: string;
    factureId: string;
    canal: 'WHATSAPP' | 'SMS';
    message: string;
    montantFCFA: number;
  }): Relance {
    const abonne = this.abonnes.find((a) => a.id === params.abonneId);

    const newRelance: Relance = {
      id: 'relance-' + Date.now(),
      organisationId: abonne?.organisationId || this.currentUser.organisationId,
      abonneId: params.abonneId,
      abonneNom: abonne ? `${abonne.prenom} ${abonne.nom}` : 'Abonné',
      abonneTel: abonne?.telephone || '',
      dateRelance: new Date().toISOString().replace('T', ' ').substring(0, 16),
      canal: params.canal,
      message: params.message,
      montantReclameFCFA: params.montantFCFA,
      statut: 'ENVOYE',
    };

    this.relances.unshift(newRelance);
    save('relances', this.relances);

    this.logAudit(
      'ENVOI_RELANCE',
      'Relances',
      newRelance.id,
      `Relance [${params.canal}] envoyée à ${newRelance.abonneNom} (${params.montantFCFA.toLocaleString('fr-FR')} FCFA dus)`
    );
    this.notify();
    return newRelance;
  }

  // --- Rapport Journalier (Revenus, Dépenses, Production d'eau) ---
  public getRapportJournalier(targetDateStr?: string) {
    const today = targetDateStr || new Date().toISOString().split('T')[0];
    const org = this.getCurrentOrganisation();
    const paiements = this.getPaiements().filter((p) => p.datePaiement.startsWith(today));
    const totalRevenusFCFA = paiements.reduce((sum, p) => sum + p.montantFCFA, 0);

    const paiementsParMode = {
      wave: paiements.filter((p) => p.modePaiement === 'WAVE').reduce((sum, p) => sum + p.montantFCFA, 0),
      orangeMoney: paiements.filter((p) => p.modePaiement === 'ORANGE_MONEY').reduce((sum, p) => sum + p.montantFCFA, 0),
      especes: paiements.filter((p) => p.modePaiement === 'ESPECES').reduce((sum, p) => sum + p.montantFCFA, 0),
      autres: paiements.filter((p) => !['WAVE', 'ORANGE_MONEY', 'ESPECES'].includes(p.modePaiement)).reduce((sum, p) => sum + p.montantFCFA, 0),
    };

    const depenses = this.getDepenses().filter(
      (d) => d.statut === 'VALIDEE' && (d.dateDepense === today || d.dateValidation?.startsWith(today))
    );
    const totalDepensesFCFA = depenses.reduce((sum, d) => sum + d.montantFCFA, 0);

    const soldeNetJournalierFCFA = totalRevenusFCFA - totalDepensesFCFA;

    const production = this.getProduction().filter((p) => p.dateReleve === today);
    const totalVolumeProduitM3 = production.reduce((sum, p) => sum + p.volumeProduitM3, 0);

    const comptes = this.getComptes();
    const totalSoldeCaisseFCFA = comptes.reduce((sum, c) => sum + c.soldeActuelFCFA, 0);

    let formattedDateFr = today;
    try {
      const parts = today.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        formattedDateFr = new Intl.DateTimeFormat('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }).format(d);
        formattedDateFr = formattedDateFr.charAt(0).toUpperCase() + formattedDateFr.slice(1);
      }
    } catch {
      formattedDateFr = today;
    }

    return {
      date: today,
      formattedDateFr,
      organisationNom: org?.nom || this.currentUser.organisationNom || 'ASUFOR Touba Toul',
      forages: this.getForages().map((f) => ({ id: f.id, nom: f.nom })),
      paiements,
      totalRevenusFCFA,
      paiementsParMode,
      depenses,
      totalDepensesFCFA,
      soldeNetJournalierFCFA,
      production,
      totalVolumeProduitM3,
      comptes,
      totalSoldeCaisseFCFA,
      agentNom: `${this.currentUser.prenom} ${this.currentUser.nom}`,
      agentRole: this.currentUser.role,
    };
  }

  // --- Rapport Financier Mensuel Complet (Factures, Paiements, Dépenses) ---
  public getRapportFinancierMensuel(targetMonthStr?: string) {
    const currentMonth = targetMonthStr || new Date().toISOString().substring(0, 7); // "YYYY-MM"
    const org = this.getCurrentOrganisation();

    // 1. Factures du mois
    const factures = this.getFactures().filter(
      (f) => f.dateEmission.startsWith(currentMonth) || f.periode.toLowerCase().includes('novembre')
    );
    const totalFactureTTC = factures.reduce((sum, f) => sum + f.totalTTCFCFA, 0);
    const totalFactureM3 = factures.reduce((sum, f) => sum + f.consommationM3, 0);
    const totalImpayesFactures = factures.reduce((sum, f) => sum + f.resteDuFCFA, 0);
    const facturesPayeesCount = factures.filter((f) => f.statut === 'PAYEE').length;
    const tauxRecouvrement = factures.length > 0 ? Math.round((facturesPayeesCount / factures.length) * 100) : 0;

    // 2. Paiements du mois
    const paiements = this.getPaiements().filter((p) => p.datePaiement.startsWith(currentMonth));
    const totalRecettes = paiements.reduce((sum, p) => sum + p.montantFCFA, 0);
    const paiementsParMode = {
      wave: paiements.filter((p) => p.modePaiement === 'WAVE').reduce((sum, p) => sum + p.montantFCFA, 0),
      orangeMoney: paiements.filter((p) => p.modePaiement === 'ORANGE_MONEY').reduce((sum, p) => sum + p.montantFCFA, 0),
      especes: paiements.filter((p) => p.modePaiement === 'ESPECES').reduce((sum, p) => sum + p.montantFCFA, 0),
      autres: paiements.filter((p) => !['WAVE', 'ORANGE_MONEY', 'ESPECES'].includes(p.modePaiement)).reduce((sum, p) => sum + p.montantFCFA, 0),
    };

    // 3. Dépenses validées du mois
    const depenses = this.getDepenses().filter(
      (d) => d.statut === 'VALIDEE' && (d.dateDepense.startsWith(currentMonth) || d.dateValidation?.startsWith(currentMonth))
    );
    const totalDepenses = depenses.reduce((sum, d) => sum + d.montantFCFA, 0);
    const depensesParCategorie: Record<string, number> = {};
    depenses.forEach((d) => {
      depensesParCategorie[d.categorie] = (depensesParCategorie[d.categorie] || 0) + d.montantFCFA;
    });

    const margeNetteExploitation = totalRecettes - totalDepenses;

    // 4. Production d'eau du mois
    const production = this.getProduction().filter((p) => p.dateReleve.startsWith(currentMonth));
    const totalVolumeProduitM3 = production.reduce((sum, p) => sum + p.volumeProduitM3, 0);

    // 5. Comptes de trésorerie
    const comptes = this.getComptes();
    const totalSoldeTresorerie = comptes.reduce((sum, c) => sum + c.soldeActuelFCFA, 0);

    // Formatting month in French, e.g. "Novembre 2026"
    let formattedMonthFr = currentMonth;
    try {
      const [year, month] = currentMonth.split('-');
      const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      formattedMonthFr = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(d);
      formattedMonthFr = formattedMonthFr.charAt(0).toUpperCase() + formattedMonthFr.slice(1);
    } catch {
      formattedMonthFr = currentMonth;
    }

    return {
      mois: currentMonth,
      formattedMonthFr,
      organisationNom: org?.nom || this.currentUser.organisationNom || 'ASUFOR Touba Toul',
      departement: org?.departement || 'Tivaouane',
      region: org?.region || 'Thiès',
      forages: this.getForages().map((f) => ({ id: f.id, nom: f.nom })),
      factures,
      totalFactureTTC,
      totalFactureM3,
      totalImpayesFactures,
      facturesPayeesCount,
      tauxRecouvrement,
      paiements,
      totalRecettes,
      paiementsParMode,
      depenses,
      totalDepenses,
      depensesParCategorie,
      margeNetteExploitation,
      production,
      totalVolumeProduitM3,
      comptes,
      totalSoldeTresorerie,
      agentNom: `${this.currentUser.prenom} ${this.currentUser.nom}`,
      agentRole: this.currentUser.role,
    };
  }

  // --- Live Automated Polling & Telemetry Updates ---
  public simulateLiveTelemetryPulse(): {
    type: 'PRODUCTION' | 'PAIEMENT' | 'HEARTBEAT';
    title: string;
    details: string;
    valeurFormatee: string;
    volumeAddedM3?: number;
    montantFCFA?: number;
  } {
    const today = new Date().toISOString().split('T')[0];
    const forages = this.forages.filter((f) => f.statut === 'EN_SERVICE');
    const selectedForage = forages[0] || this.forages[0];

    // Determine pulse type: alternate between Pumping Production increments (65% probability) and incoming payment collections (35% probability)
    const randomPick = Math.random();

    // 1. PAYMENT TICK (~35% chance or if unpaid invoices exist)
    const unpaidFactures = this.factures.filter(
      (f) => ['NON_PAYEE', 'PARTIELLEMENT_PAYEE', 'EN_RETARD'].includes(f.statut) && f.resteDuFCFA > 0
    );

    if (randomPick < 0.35 && unpaidFactures.length > 0) {
      // Pick an unpaid invoice
      const fac = unpaidFactures[Math.floor(Math.random() * unpaidFactures.length)];
      // Payment amount: either full remaining debt or a fraction
      const paymentAmount = fac.resteDuFCFA > 10000 
        ? Math.min(fac.resteDuFCFA, 5000 + Math.floor(Math.random() * 5) * 1000)
        : fac.resteDuFCFA;

      const channels: ('WAVE' | 'ORANGE_MONEY')[] = ['WAVE', 'ORANGE_MONEY'];
      const channel = channels[Math.floor(Math.random() * channels.length)];

      this.encaisserPaiement({
        factureId: fac.id,
        montantFCFA: paymentAmount,
        modePaiement: channel,
        referenceTransaction: `${channel}-${Date.now().toString().slice(-6)}`,
      });

      return {
        type: 'PAIEMENT',
        title: `Paiement mobile reçu (${channel})`,
        details: `${fac.abonneNom} (${fac.abonneCode}) • Facture ${fac.numeroFacture}`,
        valeurFormatee: `+${paymentAmount.toLocaleString('fr-FR')} FCFA`,
        montantFCFA: paymentAmount,
      };
    }

    // 2. PRODUCTION TELEMETRY TICK (hydraulic flowmeter pulse)
    if (selectedForage) {
      // Flow incremental increment: +0.2 to +1.2 m3 per pulse
      const incrementalM3 = Math.round((0.3 + Math.random() * 0.9) * 10) / 10;
      
      // Look for today's production record for this borehole
      const todaysProd = this.production.find(
        (p) => p.forageId === selectedForage.id && p.dateReleve === today
      );

      if (todaysProd) {
        todaysProd.nouvelIndexM3 = Math.round((todaysProd.nouvelIndexM3 + incrementalM3) * 10) / 10;
        todaysProd.volumeProduitM3 = Math.round((todaysProd.volumeProduitM3 + incrementalM3) * 10) / 10;
      } else {
        // Create new daily production record
        const lastProd = this.production.find((p) => p.forageId === selectedForage.id);
        const lastIndex = lastProd ? lastProd.nouvelIndexM3 : 1200;
        const newProdRecord = {
          id: 'prod-telemetry-' + Date.now(),
          organisationId: selectedForage.organisationId,
          forageId: selectedForage.id,
          forageNom: selectedForage.nom,
          dateReleve: today,
          ancienIndexM3: lastIndex,
          nouvelIndexM3: Math.round((lastIndex + incrementalM3) * 10) / 10,
          volumeProduitM3: incrementalM3,
          agentNom: 'Automate Télémétrie IoT',
        };
        this.production.unshift(newProdRecord);
      }

      save('production', this.production);
      this.notify();

      return {
        type: 'PRODUCTION',
        title: `Débitmétrie en direct • ${selectedForage.nom}`,
        details: `Pompage actif • Capteur électromagnétique étalonné`,
        valeurFormatee: `+${incrementalM3} m³`,
        volumeAddedM3: incrementalM3,
      };
    }

    return {
      type: 'HEARTBEAT',
      title: 'Télémétrie active',
      details: 'Automates et passerelles connectés sans anomalie',
      valeurFormatee: '100% opérationnel',
    };
  }
}

export const store = new FactureauStore();
