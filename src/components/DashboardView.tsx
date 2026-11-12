import React, { useState, useEffect } from 'react';
import { motion, type Variants } from 'motion/react';
import {
  Users,
  Droplets,
  Receipt,
  Wallet,
  AlertTriangle,
  Wrench,
  TrendingUp,
  CreditCard,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  PlusCircle,
  FileText,
  Activity,
  Layers,
  ShieldCheck,
  MessageSquare,
  FileDown,
  Camera,
  RefreshCw,
  Play,
  Pause,
  Radio,
  Zap,
  Filter,
  MapPin,
  Gauge,
  X,
} from 'lucide-react';
import { DashboardCharts } from './DashboardCharts';
import { DailyWaterComparisonChart } from './DailyWaterComparisonChart';
import { ActiveAlertsWidget } from './ActiveAlertsWidget';
import { FactureSimulationWidget } from './FactureSimulationWidget';
import { RapportJournalierModal } from './RapportJournalierModal';
import { RapportMensuelModal } from './RapportMensuelModal';
import { CompteurPhotoScannerModal } from './CompteurPhotoScannerModal';
import { store } from '../services/store';
import { telemetryService, TelemetryStatus } from '../services/telemetryService';
import { UserProfile } from '../types';
import { formatFCFA } from '../utils/formatters';

// Animation variants and helper for staggered entrance transition on cards (fade & slide)
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.04,
    },
  },
};

export const cardVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: 'easeOut',
    },
  },
};

export const cardMotionProps = (delaySec: number = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.45,
    delay: delaySec,
    ease: 'easeOut' as const,
  },
});

interface DashboardViewProps {
  onNavigate: (module: string) => void;
  onOpenQuickReading?: () => void;
  onOpenQuickPayment?: () => void;
  onOpenQuickExpense?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenQuickReading,
  onOpenQuickPayment,
  onOpenQuickExpense,
}) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(store.getCurrentUser());
  const [showDailyReportModal, setShowDailyReportModal] = useState<boolean>(false);
  const [showMonthlyReportModal, setShowMonthlyReportModal] = useState<boolean>(false);
  const [showScannerModal, setShowScannerModal] = useState<boolean>(false);
  const [, setStoreTick] = useState<number>(0);
  const [telemetryStatus, setTelemetryStatus] = useState<TelemetryStatus>(telemetryService.getStatus());
  const [secondsAgo, setSecondsAgo] = useState<number>(0);
  const [pulseHighlight, setPulseHighlight] = useState<'NONE' | 'PRODUCTION' | 'PAIEMENT'>('NONE');
  const [isManualSyncing, setIsManualSyncing] = useState<boolean>(false);
  const [selectedForageId, setSelectedForageId] = useState<string>('ALL');

  useEffect(() => {
    // 1. Reactive subscription to store state (re-renders all dashboard KPIs upon any update)
    const unsubStore = store.subscribe(() => {
      setCurrentUser(store.getCurrentUser());
      setStoreTick((t) => t + 1);
    });

    // 2. Telemetry polling subscription
    const unsubTelemetry = telemetryService.subscribe((status) => {
      setTelemetryStatus(status);
      setSecondsAgo(0);

      // Flash highlight on related card
      if (status.lastEvent?.type === 'PRODUCTION') {
        setPulseHighlight('PRODUCTION');
        setTimeout(() => setPulseHighlight('NONE'), 1800);
      } else if (status.lastEvent?.type === 'PAIEMENT') {
        setPulseHighlight('PAIEMENT');
        setTimeout(() => setPulseHighlight('NONE'), 1800);
      }
    });

    // 3. 1-second ticker for accurate "il y a Xs" live indicator
    const secTimer = setInterval(() => {
      setSecondsAgo((s) => s + 1);
    }, 1000);

    return () => {
      unsubStore();
      unsubTelemetry();
      clearInterval(secTimer);
    };
  }, []);

  const handleManualSync = () => {
    setIsManualSyncing(true);
    telemetryService.triggerPulse();
    setTimeout(() => setIsManualSyncing(false), 500);
  };

  const handleTogglePolling = () => {
    telemetryService.toggle();
  };

  const handleChangeInterval = (ms: number) => {
    telemetryService.setIntervalMs(ms);
  };

  const forages = store.getForages();
  const abonnes = store.getAbonnes();
  const factures = store.getFactures();
  const paiements = store.getPaiements();
  const depenses = store.getDepenses();
  const comptes = store.getComptes();
  const pannes = store.getPannes();
  const production = store.getProduction();
  const bornes = store.getBornes();
  const ventesBornes = store.getVentesBornes();
  const versementsBornes = store.getVersementsBornes();
  const auditLogs = store.getAuditLogs().slice(0, 6);
  const organisations = store.getOrganisations();

  const selectedForage = selectedForageId === 'ALL'
    ? null
    : forages.find((f) => f.id === selectedForageId);

  // Filtered collections according to selected forage
  const filteredAbonnes = selectedForageId === 'ALL'
    ? abonnes
    : abonnes.filter((a) => a.forageId === selectedForageId);

  const filteredFactures = selectedForageId === 'ALL'
    ? factures
    : factures.filter((f) => f.forageId === selectedForageId);

  const filteredPaiements = selectedForageId === 'ALL'
    ? paiements
    : paiements.filter((p) => p.forageId === selectedForageId);

  const filteredDepenses = selectedForageId === 'ALL'
    ? depenses
    : depenses.filter((d) => !d.forageId || d.forageId === selectedForageId);

  const filteredPannes = selectedForageId === 'ALL'
    ? pannes
    : pannes.filter((p) => p.forageId === selectedForageId);

  const filteredProduction = selectedForageId === 'ALL'
    ? production
    : production.filter((p) => p.forageId === selectedForageId);

  const totalRecettes = filteredPaiements.reduce((sum, p) => sum + p.montantFCFA, 0);
  const totalDepenses = filteredDepenses
    .filter((d) => d.statut === 'VALIDEE')
    .reduce((sum, d) => sum + d.montantFCFA, 0);
  const totalSoldeCaisse = comptes.reduce((sum, c) => sum + c.soldeActuelFCFA, 0);

  const totalFacturesEmises = filteredFactures.length;
  const facturesPayees = filteredFactures.filter((f) => f.statut === 'PAYEE').length;
  const totalImpayes = filteredFactures
    .filter((f) => ['NON_PAYEE', 'PARTIELLEMENT_PAYEE', 'EN_RETARD'].includes(f.statut))
    .reduce((sum, f) => sum + f.resteDuFCFA, 0);

  const pannesActives = filteredPannes.filter((p) => p.statut !== 'REPARE').length;

  const bilanProd = store.getBilanProduction(selectedForageId === 'ALL' ? undefined : selectedForageId);

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isAdminOrg = currentUser.role === 'ADMIN_ORG';
  const isTresorier = currentUser.role === 'TRESORIER';
  const isReleveur = currentUser.role === 'RELEVEUR';
  const isFontainier = currentUser.role === 'FONTAINIER';
  const isLecteur = currentUser.role === 'LECTEUR';

  // Fontainier specific calculations
  const fontainierVentes = ventesBornes.filter((v) => v.fontainierId === currentUser.id);
  const fontainierVersements = versementsBornes.filter((v) => v.fontainierId === currentUser.id);
  const fontainierTotalVentes = fontainierVentes.reduce((sum, v) => sum + v.totalVenteFCFA, 0);
  const fontainierTotalVerse = fontainierVersements.reduce((sum, v) => sum + v.montantVerseFCFA, 0);
  const fontainierResteAVerser = Math.max(0, fontainierTotalVentes - fontainierTotalVerse);

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Welcome Banner */}
      <motion.div
        {...cardMotionProps(0.04)}
        className="bg-gradient-to-r from-[#082F49] via-[#0c4a75] to-[#0369A1] dark:from-[#041c2c] dark:via-[#07304d] dark:to-[#03527e] rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-sky-900/50"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              Espace {currentUser.role}
            </span>
            <span className="text-xs text-slate-300">
              {currentUser.organisationNom || 'Supervision SaaS'}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Bonjour, {currentUser.prenom} {currentUser.nom}
          </h1>
          <p className="text-sm text-cyan-100/90 mt-1">
            {isSuperAdmin && 'Supervision globale des organisations, abonnements et quotas du parc de forages.'}
            {isAdminOrg && "Supervision complète des forages, de la distribution d'eau et de la trésorerie."}
            {isTresorier && 'Gestion des encaissements, des comptes de caisse et des décaissements.'}
            {isReleveur && "Relevés de compteurs programmés et suivi des consommations d'eau."}
            {isFontainier && 'Gestion des ventes de la borne-fontaine et des versements à la caisse.'}
            {isLecteur && 'Consultation en lecture seule des rapports et indicateurs de performance.'}
          </p>
        </div>

        {/* Quick actions according to permissions */}
        <div className="flex flex-wrap items-center gap-2">
          {store.canAccessModule('releves') && !isLecteur && (
            <>
              <button
                onClick={() => setShowScannerModal(true)}
                className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow cursor-pointer shrink-0"
                title="Scanner ou photographier le cadran du compteur d'eau (caméra / photo)"
              >
                <Camera className="w-4 h-4 text-slate-950" />
                <span>Scanner compteur</span>
              </button>

              <button
                onClick={() => onNavigate('compteurs')}
                className="bg-white/15 hover:bg-white/25 text-white border border-white/25 px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-cyan-300" />
                <span>Relevé manuel</span>
              </button>
            </>
          )}

          {store.canWriteFinancial() && (
            <>
              <button
                onClick={() => onNavigate('paiements')}
                className="bg-emerald-500 hover:bg-emerald-400 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Encaisser paiement</span>
              </button>

              <button
                onClick={() => onNavigate('caisse')}
                className="bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Wallet className="w-4 h-4 text-cyan-300" />
                <span>Nouvelle dépense</span>
              </button>
            </>
          )}

          {isFontainier && (
            <button
              onClick={() => onNavigate('bornes')}
              className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Droplets className="w-4 h-4" />
              <span>Enregistrer vente d'eau</span>
            </button>
          )}

          {/* Exporter le rapport du jour */}
          <button
            onClick={() => setShowDailyReportModal(true)}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/25 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0"
            title="Exporter le rapport d'exploitation journalier en PDF (Revenus, Dépenses, Production d'eau)"
          >
            <FileDown className="w-4 h-4 text-cyan-300" />
            <span>Rapport du jour</span>
            <span className="text-[10px] bg-cyan-500/30 text-cyan-200 px-1.5 py-0.2 rounded font-mono font-bold">PDF</span>
          </button>

          {/* Exporter le rapport mensuel complet */}
          <button
            onClick={() => setShowMonthlyReportModal(true)}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold px-3.5 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shadow cursor-pointer shrink-0"
            title="Générer le rapport financier mensuel officiel complet au format PDF (factures, paiements, dépenses)"
          >
            <FileText className="w-4 h-4 text-slate-950" />
            <span>Rapport Mensuel</span>
            <span className="text-[10px] bg-slate-950/20 text-slate-950 px-1.5 py-0.2 rounded font-mono font-black">PDF</span>
          </button>
        </div>
      </motion.div>

      {/* ━━━━━━━━━━ LIVE TELEMETRY & REAL-TIME POLLING CONTROL BAR ━━━━━━━━━━ */}
      <motion.div
        {...cardMotionProps(0.08)}
        className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5 transition-colors duration-200"
      >
        {/* Left: Live status with pulsing beacon */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
            {telemetryStatus.isRunning ? (
              <>
                <span className="absolute w-3 h-3 rounded-full bg-emerald-500 animate-ping opacity-75" />
                <span className="relative w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </>
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-[#082F49] dark:text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <Radio className={`w-3.5 h-3.5 ${telemetryStatus.isRunning ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
                Télémétrie en Direct & Polling
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  telemetryStatus.isRunning
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    : 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                }`}
              >
                {telemetryStatus.isRunning ? 'Actif' : 'En pause'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
              <span>Synchronisé il y a <strong className="font-mono text-slate-700 dark:text-slate-200">{secondsAgo}s</strong></span>
              <span>•</span>
              <span>Intervalle : {telemetryStatus.intervalMs / 1000}s</span>
              <span>•</span>
              <span className="font-mono text-[10px] text-slate-400">Flux #{telemetryStatus.pulseCount}</span>
            </div>
          </div>
        </div>

        {/* Center: Latest live event badge */}
        {telemetryStatus.lastEvent && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs w-full md:w-auto">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 shrink-0">Dernier flux :</span>
            <div className="flex items-center gap-1.5 truncate">
              {telemetryStatus.lastEvent.type === 'PRODUCTION' ? (
                <Droplets className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
              ) : telemetryStatus.lastEvent.type === 'PAIEMENT' ? (
                <CreditCard className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <Activity className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              )}
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                {telemetryStatus.lastEvent.title}
              </span>
              <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-white dark:bg-slate-900 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700 shrink-0">
                {telemetryStatus.lastEvent.valeurFormatee}
              </span>
            </div>
          </div>
        )}

        {/* Right: Controls (Pause/Play, Manual Refresh, Frequency) */}
        <div className="flex items-center gap-1.5 self-end md:self-auto shrink-0">
          {/* Polling Interval Selector */}
          <div className="inline-flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-mono font-bold border border-slate-200 dark:border-slate-700">
            {[
              { label: '3s', ms: 3000 },
              { label: '6s', ms: 6000 },
              { label: '15s', ms: 15000 },
            ].map((opt) => (
              <button
                key={opt.ms}
                type="button"
                onClick={() => handleChangeInterval(opt.ms)}
                className={`px-2 py-1 rounded transition cursor-pointer ${
                  telemetryStatus.intervalMs === opt.ms
                    ? 'bg-white dark:bg-slate-700 text-cyan-700 dark:text-cyan-300 font-black shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title={`Régler l'intervalle de polling à ${opt.label}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Pause / Resume Button */}
          <button
            type="button"
            onClick={handleTogglePolling}
            className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              telemetryStatus.isRunning
                ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                : 'bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
            }`}
            title={telemetryStatus.isRunning ? 'Suspendre la mise à jour automatique' : 'Reprendre la mise à jour automatique'}
          >
            {telemetryStatus.isRunning ? (
              <Pause className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
            ) : (
              <Play className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            )}
            <span className="hidden sm:inline">{telemetryStatus.isRunning ? 'Pause' : 'Reprendre'}</span>
          </button>

          {/* Instant Manual Refresh Button */}
          <button
            type="button"
            onClick={handleManualSync}
            disabled={isManualSyncing}
            className="bg-cyan-600 hover:bg-cyan-500 text-white p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            title="Forcer une actualisation immédiate des indicateurs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
        </div>
      </motion.div>

      {/* ━━━━━━━━━━ SÉLECTEUR DE FORAGE ANALYTIQUE (FILTRAGE GLOBAL DASHBOARD) ━━━━━━━━━━ */}
      <motion.div
        {...cardMotionProps(0.08)}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm transition-colors duration-200"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-200/50 dark:border-cyan-800/50">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-[#082F49] dark:text-white">
                  Périmètre d'Analyse : {selectedForage ? selectedForage.nom : 'Tous les Forages (Consolidé)'}
                </h3>
                {selectedForageId !== 'ALL' && (
                  <span className="text-[10px] bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 font-bold px-2 py-0.5 rounded-full border border-cyan-200 dark:border-cyan-800">
                    Filtre forage actif
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Filtrage en temps réel des données de production hydrique, ventes/facturation et pannes techniques.
              </p>
            </div>
          </div>

          {/* Quick Reset or Count pill */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            {selectedForageId !== 'ALL' ? (
              <button
                type="button"
                onClick={() => setSelectedForageId('ALL')}
                className="text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-cyan-600 dark:hover:text-cyan-400 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-cyan-400 dark:hover:border-cyan-500 transition flex items-center gap-1.5 cursor-pointer bg-slate-50 dark:bg-slate-800/80 shadow-xs"
                title="Revenir à la vue consolidée de tous les forages"
              >
                <X className="w-3.5 h-3.5" />
                <span>Tous les forages</span>
              </button>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5 font-medium">
                <Layers className="w-3.5 h-3.5 text-cyan-500" />
                <span>{forages.length} forages dans le réseau</span>
              </span>
            )}
          </div>
        </div>

        {/* Buttons Grid to select forage */}
        <div className="pt-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
          {/* Card: Tous les forages */}
          <button
            type="button"
            onClick={() => setSelectedForageId('ALL')}
            className={`p-3 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
              selectedForageId === 'ALL'
                ? 'bg-gradient-to-r from-[#082F49] to-[#0c4a75] text-white border-[#082F49] shadow-sm ring-2 ring-sky-400/30'
                : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700/80'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              selectedForageId === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              <Layers className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-extrabold truncate">Tous les forages</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                  selectedForageId === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {forages.length}
                </span>
              </div>
              <div className={`text-[11px] mt-0.5 truncate ${
                selectedForageId === 'ALL' ? 'text-cyan-200' : 'text-slate-400 dark:text-slate-400'
              }`}>
                Vue globale consolidée
              </div>
            </div>
          </button>

          {/* Individual Forage buttons */}
          {forages.map((f) => {
            const isSelected = selectedForageId === f.id;
            const forageAbonnesCount = abonnes.filter((a) => a.forageId === f.id).length;
            const foragePannesCount = pannes.filter((p) => p.forageId === f.id && p.statut !== 'REPARE').length;

            return (
              <button
                type="button"
                key={f.id}
                onClick={() => setSelectedForageId(f.id)}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-600 to-sky-700 text-white border-cyan-500 shadow-sm ring-2 ring-cyan-400/50'
                    : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700/80'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300'
                }`}>
                  <Droplets className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-extrabold truncate" title={f.nom}>
                      {f.nom}
                    </span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        f.statut === 'EN_SERVICE'
                          ? 'bg-emerald-400 ring-2 ring-emerald-300/40'
                          : f.statut === 'EN_PANNE'
                          ? 'bg-rose-500 ring-2 ring-rose-300/40'
                          : 'bg-amber-400 ring-2 ring-amber-300/40'
                      }`}
                      title={`Statut technique : ${f.statut}`}
                    />
                  </div>
                  <div className={`text-[11px] mt-0.5 flex items-center justify-between gap-1 ${
                    isSelected ? 'text-cyan-100' : 'text-slate-400 dark:text-slate-400'
                  }`}>
                    <span className="truncate">{f.localite}</span>
                    <span className="font-mono text-[10px] shrink-0 font-medium">
                      {forageAbonnesCount} ab. {foragePannesCount > 0 ? `• ⚠️ ${foragePannesCount}` : ''}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Forage Technical Specs Strip (when a forage is selected) */}
        {selectedForage && (
          <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 bg-cyan-50/60 dark:bg-cyan-950/30 -mx-4 sm:-mx-5 -mb-4 sm:-mb-5 p-3.5 sm:px-5 rounded-b-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1 font-bold text-[#082F49] dark:text-cyan-300">
                <MapPin className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                {selectedForage.localite} ({selectedForage.region})
              </span>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
              <span className="flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-slate-400" />
                Débit : <strong className="text-slate-900 dark:text-white font-mono">{selectedForage.debitNominalM3H} m³/h</strong>
              </span>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
              <span>
                Profondeur : <strong className="text-slate-900 dark:text-white font-mono">{selectedForage.profondeurMetres} m</strong>
              </span>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
              <span>
                Pompe : <strong className="text-cyan-700 dark:text-cyan-400 font-semibold">{selectedForage.typePompe} ({selectedForage.puissanceKw} kW)</strong>
              </span>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
              <span>
                Tarif : <strong className="text-slate-900 dark:text-white font-mono">{selectedForage.tarifM3FCFA} FCFA/m³</strong>
              </span>
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5 ml-auto">
              <span>Resp. technique : {selectedForage.responsableNom}</span>
              <span className="font-mono text-cyan-700 dark:text-cyan-400">({selectedForage.responsableTel})</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* ━━━━━━━━━━ SUPER ADMIN VIEW ━━━━━━━━━━ */}
      {isSuperAdmin && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              {...cardMotionProps(0.10)}
              whileHover={{ y: -3, transition: { duration: 0.18 } }}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200"
            >
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Organisations sous contrat</div>
              <div className="text-2xl font-extrabold text-[#082F49] dark:text-white mt-1">{organisations.length}</div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% actives (Touba Toul, KMS)
              </div>
            </motion.div>

            <motion.div
              {...cardMotionProps(0.16)}
              whileHover={{ y: -3, transition: { duration: 0.18 } }}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200"
            >
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Revenu Récurrent SaaS (MRR)</div>
              <div className="text-2xl font-extrabold text-cyan-700 dark:text-cyan-400 mt-1">29 800 FCFA</div>
              <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">Abonnements mensuels actifs</div>
            </motion.div>

            <motion.div
              {...cardMotionProps(0.22)}
              whileHover={{ y: -3, transition: { duration: 0.18 } }}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200"
            >
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total forages gérés</div>
              <div className="text-2xl font-extrabold text-sky-800 dark:text-sky-300 mt-1">3 Forages</div>
              <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">Capacité max : 14 forages</div>
            </motion.div>

            <motion.div
              {...cardMotionProps(0.28)}
              whileHover={{ y: -3, transition: { duration: 0.18 } }}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200"
            >
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Sécurité RLS multi-tenant</div>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">100% Isolée</div>
              <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">0 fuite inter-organisations</div>
            </motion.div>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━ FONTAINIER SPECIFIC VIEW ━━━━━━━━━━ */}
      {isFontainier && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div
            {...cardMotionProps(0.10)}
            whileHover={{ y: -3, transition: { duration: 0.18 } }}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200"
          >
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ventes totales enregistrées</div>
            <div className="text-2xl font-extrabold text-[#082F49] dark:text-white mt-1">
              {formatFCFA(fontainierTotalVentes)}
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">Ventes de bassines d'eau</div>
          </motion.div>

          <motion.div
            {...cardMotionProps(0.16)}
            whileHover={{ y: -3, transition: { duration: 0.18 } }}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200"
          >
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Versements confirmés au trésorier</div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatFCFA(fontainierTotalVerse)}
            </div>
            <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Reçus validés
            </div>
          </motion.div>

          <motion.div
            {...cardMotionProps(0.22)}
            whileHover={{ y: -3, transition: { duration: 0.18 } }}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200"
          >
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Reste à verser</div>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {formatFCFA(fontainierResteAVerser)}
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">En caisse borne</div>
          </motion.div>
        </div>
      )}

      {/* ━━━━━━━━━━ RELEVEUR SPECIFIC VIEW ━━━━━━━━━━ */}
      {isReleveur && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div
            {...cardMotionProps(0.10)}
            whileHover={{ y: -3, transition: { duration: 0.18 } }}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200"
          >
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {selectedForage ? `Compteurs sur ${selectedForage.nom}` : 'Compteurs sur votre secteur'}
            </div>
            <div className="text-2xl font-extrabold text-[#082F49] dark:text-white mt-1">
              {filteredAbonnes.length} abonnés
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {selectedForage ? selectedForage.localite : 'Forage Sud & Nord'}
            </div>
          </motion.div>

          <motion.div
            {...cardMotionProps(0.16)}
            whileHover={{ y: -3, transition: { duration: 0.18 } }}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200"
          >
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Relevés saisis ce mois</div>
            <div className="text-2xl font-extrabold text-sky-700 dark:text-sky-300 mt-1">
              {store.getReleves().length} relevés
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Tournée en cours</div>
          </motion.div>

          <motion.div
            {...cardMotionProps(0.22)}
            whileHover={{ y: -3, transition: { duration: 0.18 } }}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200"
          >
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Alertes / Pannes signalées</div>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {pannesActives} signalements
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">Priorité technique</div>
          </motion.div>
        </div>
      )}

      {/* ━━━━━━━━━━ ADMIN & TRESORIER FULL KPIS ━━━━━━━━━━ */}
      {(isAdminOrg || isTresorier || isLecteur) && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1 */}
          <motion.div
            {...cardMotionProps(0.10)}
            whileHover={{ y: -3, transition: { duration: 0.18 } }}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-cyan-400/60 transition-colors duration-200"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold">
                {selectedForage ? 'Abonnés du forage' : 'Abonnés actifs'}
              </span>
              <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-cyan-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-[#082F49] dark:text-white">{filteredAbonnes.length}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
              <span className="truncate">{selectedForage ? `${selectedForage.localite}` : `${forages.length} forages gérés`}</span>
              <button
                onClick={() => onNavigate('abonnes')}
                className="text-cyan-700 dark:text-cyan-400 hover:underline font-semibold cursor-pointer shrink-0 ml-1"
              >
                Voir liste
              </button>
            </div>
          </motion.div>

          {/* KPI 2 */}
          <motion.div
            {...cardMotionProps(0.16)}
            whileHover={{ y: -3, transition: { duration: 0.18 } }}
            className={`p-5 rounded-2xl border shadow-sm transition-all duration-300 ${
              pulseHighlight === 'PAIEMENT'
                ? 'bg-emerald-50/60 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-400 ring-2 ring-emerald-400/60'
                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-cyan-400/60'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <span>{selectedForage ? 'Recettes forage' : 'Recettes totales'}</span>
                {pulseHighlight === 'PAIEMENT' && (
                  <span className="text-[10px] bg-emerald-500 text-white font-mono font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                    Live
                  </span>
                )}
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatFCFA(totalRecettes)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
              <span className="truncate">{filteredPaiements.length} paiements {selectedForage ? 'du forage' : 'reçus'}</span>
              <button
                onClick={() => onNavigate('paiements')}
                className="text-emerald-700 dark:text-emerald-400 hover:underline font-semibold cursor-pointer shrink-0 ml-1"
              >
                Détails
              </button>
            </div>
          </motion.div>

          {/* KPI 3 */}
          <motion.div
            {...cardMotionProps(0.22)}
            whileHover={{ y: -3, transition: { duration: 0.18 } }}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-cyan-400/60 transition-colors duration-200"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold">
                {selectedForage ? 'Dépenses forage' : 'Dépenses validées'}
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
              {formatFCFA(totalDepenses)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
              <span className="truncate">{selectedForage ? `Charges ${selectedForage.nom}` : 'Carburant, Senelec, réseau'}</span>
              <button
                onClick={() => onNavigate('caisse')}
                className="text-rose-700 dark:text-rose-400 hover:underline font-semibold cursor-pointer shrink-0 ml-1"
              >
                Justificatifs
              </button>
            </div>
          </motion.div>

          {/* KPI 4 */}
          <motion.div
            {...cardMotionProps(0.28)}
            whileHover={{ y: -3, transition: { duration: 0.18 } }}
            className={`p-5 rounded-2xl border shadow-sm transition-all duration-300 ${
              pulseHighlight === 'PAIEMENT'
                ? 'bg-emerald-50/60 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-400 ring-2 ring-emerald-400/60'
                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-cyan-400/60'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <span>Solde global de caisse</span>
                {pulseHighlight === 'PAIEMENT' && (
                  <span className="text-[10px] bg-emerald-500 text-white font-mono font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                    +Trésorerie
                  </span>
                )}
              </span>
              <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-cyan-700 dark:text-cyan-300">
              {formatFCFA(totalSoldeCaisse)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
              <span>3 comptes (Espèces, Wave, Banque)</span>
              <button
                onClick={() => onNavigate('caisse')}
                className="text-cyan-700 dark:text-cyan-400 hover:underline font-semibold cursor-pointer"
              >
                Trésorerie
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ━━━━━━━━━━ WIDGET RÉCAPITULATIF DES ALERTES ACTIVES ━━━━━━━━━━ */}
      <motion.div {...cardMotionProps(0.32)}>
        <ActiveAlertsWidget onNavigate={onNavigate} />
      </motion.div>

      {/* ━━━━━━━━━━ DYNAMIC RECHARTS CHARTS (Revenus & Production) ━━━━━━━━━━ */}
      {(isAdminOrg || isTresorier || isLecteur || isSuperAdmin) && (
        <motion.div {...cardMotionProps(0.38)}>
          <DashboardCharts
            forages={forages}
            selectedForageId={selectedForageId}
            onSelectForageId={setSelectedForageId}
          />
        </motion.div>
      )}

      {/* ━━━━━━━━━━ COURBE DE PRODUCTION D'EAU QUOTIDIENNE VS CONSOMMATION FACTURÉE (RECHARTS) ━━━━━━━━━━ */}
      {(isAdminOrg || isTresorier || isLecteur || isSuperAdmin || isReleveur) && (
        <motion.div {...cardMotionProps(0.39)}>
          <DailyWaterComparisonChart
            forages={forages}
            selectedForageId={selectedForageId}
            onSelectForageId={setSelectedForageId}
            onNavigate={onNavigate}
          />
        </motion.div>
      )}

      {/* ━━━━━━━━━━ UTILITAIRE DE SIMULATION DE FACTURE ━━━━━━━━━━ */}
      {(isAdminOrg || isTresorier || isLecteur || isSuperAdmin || isReleveur) && (
        <motion.div {...cardMotionProps(0.40)}>
          <FactureSimulationWidget onNavigate={onNavigate} />
        </motion.div>
      )}

      {/* Module Banner: SMS Alerts & Automated Notifications */}
      {(isAdminOrg || isTresorier || isSuperAdmin) && (
        <motion.div
          {...cardMotionProps(0.42)}
          whileHover={{ y: -2, transition: { duration: 0.18 } }}
          className="bg-gradient-to-r from-[#082F49] via-[#0369A1] to-[#082F49] text-white p-5 rounded-2xl shadow-sm border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-cyan-400/20 text-cyan-300 flex items-center justify-center shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-cyan-200">
                  Module Alertes SMS Automatiques (Orange SN)
                </span>
                <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Actif
                </span>
              </div>
              <p className="text-xs text-slate-200/90 mt-0.5">
                Notifications instantanées des nouvelles factures et préavis de coupures d'eau sous 48h par SMS GSM direct.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('sms-alerts')}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0"
          >
            <span>Configurer les alertes SMS</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Row: Impayés Alert & Water Balance Indicator */}
      {(isAdminOrg || isTresorier || isLecteur) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Overdue Debt & Collection Rate */}
          <motion.div
            {...cardMotionProps(0.48)}
            whileHover={{ y: -3, transition: { duration: 0.18 } }}
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors duration-200"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#082F49] dark:text-white flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-amber-500" />
                    Facturation & Ventes
                  </h3>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    {selectedForage ? `Ventes eau : ${selectedForage.nom}` : 'Ventes réseau consolidées'}
                  </div>
                </div>
                <span className="text-xs bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 rounded-full font-semibold border border-amber-200 dark:border-amber-800">
                  {facturesPayees} / {totalFacturesEmises} Payées
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Total facturé ce mois :</span>
                  <strong className="text-slate-900 dark:text-slate-100 font-mono">
                    {formatFCFA(filteredFactures.reduce((s, f) => s + f.totalTTCFCFA, 0))}
                  </strong>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Impayés & retards :</span>
                  <strong className="text-amber-600 dark:text-amber-400 font-extrabold font-mono">
                    {formatFCFA(totalImpayes)}
                  </strong>
                </div>

                {/* Progress bar */}
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <span>Taux de recouvrement</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {totalFacturesEmises > 0 ? Math.round((facturesPayees / totalFacturesEmises) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2.5 rounded-full transition-all"
                      style={{
                        width: `${totalFacturesEmises > 0 ? (facturesPayees / totalFacturesEmises) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('coupures')}
              className="mt-6 w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Gérer les impayés et relances WhatsApp</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </motion.div>

          {/* Water Production & NRW Loss Rate */}
          <motion.div
            {...cardMotionProps(0.54)}
            whileHover={{ y: -3, transition: { duration: 0.18 } }}
            className={`p-6 rounded-2xl border shadow-sm flex flex-col justify-between transition-all duration-300 ${
              pulseHighlight === 'PRODUCTION'
                ? 'bg-cyan-50/60 dark:bg-cyan-950/60 border-cyan-400 dark:border-cyan-400 ring-2 ring-cyan-400/60'
                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#082F49] dark:text-white flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-cyan-500" />
                    <span>Production & Pertes</span>
                    {pulseHighlight === 'PRODUCTION' && (
                      <span className="text-[10px] bg-cyan-500 text-white font-mono font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                        +Pompage
                      </span>
                    )}
                  </h3>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    {selectedForage ? `Pompage : ${selectedForage.nom}` : 'Bilan hydrique global'}
                  </div>
                </div>
                {bilanProd.statutAlerte === 'ALERTE_PERTE' && (
                  <span className="text-xs bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-full font-bold border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Alerte Fuites
                  </span>
                )}
                {bilanProd.statutAlerte === 'NORMAL' && (
                  <span className="text-xs bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-200 dark:border-emerald-800">
                    Rendement Optimal
                  </span>
                )}
                {bilanProd.statutAlerte === 'NON_CALCULABLE' && (
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-medium">
                    Non calculable
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Volume pompé (Production) :</span>
                  <strong className="text-slate-900 dark:text-slate-100 font-mono">{bilanProd.volumeProduitM3} m³</strong>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Volume distribué / facturé :</span>
                  <strong className="text-cyan-700 dark:text-cyan-400 font-mono">{bilanProd.volumeConsommeM3} m³</strong>
                </div>

                <div className="flex items-center justify-between text-sm border-t border-slate-100 dark:border-slate-800 pt-2">
                  <span className="text-slate-600 dark:text-slate-400">Eau non comptabilisée (Pertes) :</span>
                  <strong className={bilanProd.tauxPertePourcent && bilanProd.tauxPertePourcent > 18 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                    {bilanProd.perteVolumeM3} m³ ({bilanProd.tauxPertePourcent !== null ? `${bilanProd.tauxPertePourcent}%` : 'N/C'})
                  </strong>
                </div>

                <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                  Seuil d'alerte réglementaire de perte réseau : 18.0%.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('production')}
              className="mt-6 w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Accéder aux compteurs de production</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </motion.div>

          {/* Maintenance & Breakdowns */}
          <motion.div
            {...cardMotionProps(0.60)}
            whileHover={{ y: -3, transition: { duration: 0.18 } }}
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors duration-200"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#082F49] dark:text-white flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-indigo-500" />
                    Pannes & Maintenance
                  </h3>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    {selectedForage ? `Équipements : ${selectedForage.nom}` : 'Parc forages & stations'}
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                  pannesActives > 0 ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                }`}>
                  {pannesActives} En cours
                </span>
              </div>

              <div className="space-y-2.5">
                {filteredPannes.length === 0 ? (
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold">Aucune panne active</div>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
                        {selectedForage ? `Les équipements de ${selectedForage.nom} fonctionnent normalement.` : 'Tous les forages et stations fonctionnent sans interruption.'}
                      </div>
                    </div>
                  </div>
                ) : (
                  filteredPannes.slice(0, 3).map((panne) => (
                    <div key={panne.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                      <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                        <span>{panne.titre}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                          panne.gravite === 'HAUTE' ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300' : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        }`}>
                          {panne.gravite}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                        <span>{panne.forageNom}</span>
                        <span className={panne.statut === 'REPARE' ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-amber-600 dark:text-amber-400 font-semibold'}>
                          {panne.statut === 'REPARE' ? '✓ Réparé' : '⚙ En cours'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={() => onNavigate('pannes')}
              className="mt-6 w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Signaler ou traiter une panne</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      )}

      {/* Recent Activity & Real-time Audit Trail */}
      <motion.div
        {...cardMotionProps(0.66)}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm transition-colors duration-200"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-600" />
            <h3 className="text-base font-bold text-[#082F49] dark:text-white">Journal d'Activité Récente & Audit</h3>
          </div>
          <div className="flex items-center gap-3">
            {store.canAccessModule('audit') && (
              <button
                onClick={() => onNavigate('audit')}
                className="text-xs text-cyan-700 dark:text-cyan-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Module complet d'audit</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono hidden sm:inline">
              {currentUser.organisationNom || 'SaaS FACTUREAU'}
            </span>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-x-auto">
          {auditLogs.map((log) => (
            <div key={log.id} className="py-3 flex items-start justify-between gap-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {log.action.replace(/_/g, ' ')}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 mt-0.5">{log.details}</div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>Par : <strong className="text-slate-700 dark:text-slate-300">{log.userNom}</strong> ({log.userRole})</span>
                    <span>•</span>
                    <span className="font-mono">IP: {log.ip}</span>
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0 font-mono">
                {log.timestamp}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Daily Operations & Financial PDF Report Modal */}
      <RapportJournalierModal
        isOpen={showDailyReportModal}
        onClose={() => setShowDailyReportModal(false)}
      />

      {/* Monthly Financial PDF Report Modal */}
      <RapportMensuelModal
        isOpen={showMonthlyReportModal}
        onClose={() => setShowMonthlyReportModal(false)}
      />

      {/* Meter Camera / Photo Scanner Modal */}
      <CompteurPhotoScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
      />
    </motion.div>
  );
};
