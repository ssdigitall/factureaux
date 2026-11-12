import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  AlertOctagon,
  Wrench,
  Droplets,
  Receipt,
  Clock,
  ArrowRight,
  CheckCircle2,
  Filter,
  ChevronDown,
  ChevronUp,
  Flame,
  ShieldAlert,
  Send,
  ExternalLink,
  Info,
  Calendar,
  Boxes,
} from 'lucide-react';
import { store } from '../services/store';
import { Panne, Facture, CoupureProposition, Releve } from '../types';

export type AlertCategory = 'ALL' | 'PANNE' | 'FUITE' | 'RETARD' | 'STOCK';
export type AlertSeverity = 'CRITIQUE' | 'HAUTE' | 'MOYENNE' | 'INFO';

export interface UnifiedAlert {
  id: string;
  category: 'PANNE' | 'FUITE' | 'RETARD' | 'STOCK';
  severity: AlertSeverity;
  title: string;
  subtitle: string;
  description: string;
  dateStr: string;
  location: string;
  metricLabel?: string;
  metricValue?: string;
  metricColor?: string;
  actionLabel: string;
  targetModule: string;
  metadata?: {
    panneId?: string;
    factureId?: string;
    coupureId?: string;
    abonneId?: string;
  };
}

interface ActiveAlertsWidgetProps {
  onNavigate: (module: string) => void;
}

export const ActiveAlertsWidget: React.FC<ActiveAlertsWidgetProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<AlertCategory>('ALL');
  const [expanded, setExpanded] = useState<boolean>(false);
  const [selectedForage, setSelectedForage] = useState<string>('ALL');

  // Trigger re-render on store mutations
  const [, setTick] = useState<number>(0);
  useEffect(() => {
    return store.subscribe(() => {
      setTick((t) => t + 1);
    });
  }, []);

  const currentUser = store.getCurrentUser();
  const forages = store.getForages();
  const pannes = store.getPannes();
  const factures = store.getFactures();
  const coupures = store.getCoupures();
  const releves = store.getReleves();
  const bilanProd = store.getBilanProduction();

  // Consolidate alerts from store
  const allAlerts = useMemo<UnifiedAlert[]>(() => {
    const list: UnifiedAlert[] = [];
    const now = new Date();

    // 1. PANNES ACTIVES
    const activePannes = pannes.filter((p) => p.statut !== 'REPARE');
    activePannes.forEach((p) => {
      const isLeakRelated =
        p.titre.toLowerCase().includes('fuite') ||
        p.titre.toLowerCase().includes('tuyau') ||
        p.titre.toLowerCase().includes('vanne') ||
        p.description.toLowerCase().includes('fuite');

      // If it's explicitly a leak, we'll categorize it as FUITE, otherwise PANNE
      const cat: 'PANNE' | 'FUITE' = isLeakRelated ? 'FUITE' : 'PANNE';

      let sev: AlertSeverity = 'MOYENNE';
      if (p.gravite === 'HAUTE') sev = 'CRITIQUE';
      else if (p.gravite === 'MOYENNE') sev = 'HAUTE';
      else sev = 'MOYENNE';

      list.push({
        id: `panne-${p.id}`,
        category: cat,
        severity: sev,
        title: p.titre,
        subtitle: `${p.forageNom} • Signalé par ${p.signalePar.split(' ')[0]}`,
        description: p.description,
        dateStr: p.dateSignalement,
        location: p.forageNom,
        metricLabel: 'Statut',
        metricValue: p.statut === 'EN_COURS' ? 'Intervention en cours' : 'À planifier',
        metricColor: p.statut === 'EN_COURS' ? 'text-amber-500' : 'text-rose-500',
        actionLabel: 'Traiter l incident',
        targetModule: 'pannes',
        metadata: { panneId: p.id },
      });
    });

    // 2. FUITES & ANOMALIES RÉSEAU (Bilan production NRW + anomalies compteurs)
    if (bilanProd.statutAlerte === 'ALERTE_PERTE' && bilanProd.tauxPertePourcent !== null) {
      list.push({
        id: 'alerte-fuite-nrw',
        category: 'FUITE',
        severity: bilanProd.tauxPertePourcent > 22 ? 'CRITIQUE' : 'HAUTE',
        title: 'Taux de pertes réseau anormal (NRW)',
        subtitle: `Réseau général • Seuil réglementaire: 18% max`,
        description: `Un volume estimé de ${bilanProd.perteVolumeM3} m³ d'eau produite n'a pas été comptabilisé sur les compteurs abonnés. Risque de fuite souterraine sur la conduite principale.`,
        dateStr: "Aujourd'hui",
        location: 'Réseau de distribution',
        metricLabel: 'Pertes estimées',
        metricValue: `${bilanProd.tauxPertePourcent}% (${bilanProd.perteVolumeM3} m³)`,
        metricColor: 'text-rose-600',
        actionLabel: 'Diagnostiquer les pertes',
        targetModule: 'production',
      });
    }

    // Anomalies relevés (surconsommations suspectes indiquant fuite après compteur)
    const surconsoReleves = releves.filter((r) => r.statut === 'ANOMALIE_SURCONSOMMATION');
    surconsoReleves.forEach((r) => {
      list.push({
        id: `surconso-${r.id}`,
        category: 'FUITE',
        severity: 'MOYENNE',
        title: `Surconsommation anormale : ${r.abonneNom}`,
        subtitle: `Compteur ${r.compteurId} • Forage ${r.forageId}`,
        description: `Consommation mensuelle relevée de ${r.consommationM3} m³ largement supérieure à l'historique moyen. Forte suspicion de fuite non-détectée après compteur.`,
        dateStr: r.dateReleve,
        location: r.abonneNom,
        metricLabel: 'Volume relevé',
        metricValue: `${r.consommationM3} m³`,
        metricColor: 'text-amber-600',
        actionLabel: 'Vérifier compteur',
        targetModule: 'compteurs',
      });
    });

    // 3. RETARDS DE PAIEMENT & COUPURES IMMINENTES
    // Invoices explicitly marked EN_RETARD or overdue
    const lateFactures = factures.filter((f) => {
      if (f.statut === 'EN_RETARD') return true;
      if (['NON_PAYEE', 'PARTIELLEMENT_PAYEE'].includes(f.statut)) {
        const echeance = new Date(f.dateEcheance);
        return echeance < now;
      }
      return false;
    });

    lateFactures.forEach((f) => {
      const echeance = new Date(f.dateEcheance);
      const diffDays = Math.max(1, Math.round((now.getTime() - echeance.getTime()) / (1000 * 3600 * 24)));

      let sev: AlertSeverity = 'MOYENNE';
      if (diffDays > 30 || f.resteDuFCFA > 25000) sev = 'CRITIQUE';
      else if (diffDays > 15) sev = 'HAUTE';

      list.push({
        id: `retard-${f.id}`,
        category: 'RETARD',
        severity: sev,
        title: `Retard de paiement : ${f.abonneNom}`,
        subtitle: `Facture ${f.numeroFacture} • ${f.abonneQuartier}`,
        description: `Facture de ${f.totalTTCFCFA.toLocaleString('fr-FR')} FCFA échue depuis ${diffDays} jours. Reste à recouvrer: ${f.resteDuFCFA.toLocaleString('fr-FR')} FCFA.`,
        dateStr: `Échue le ${f.dateEcheance}`,
        location: f.abonneQuartier || 'Zone desservie',
        metricLabel: 'Reste dû',
        metricValue: `${f.resteDuFCFA.toLocaleString('fr-FR')} FCFA`,
        metricColor: 'text-rose-600',
        actionLabel: 'Relancer / Recouvrer',
        targetModule: 'coupures',
        metadata: { factureId: f.id, abonneId: f.abonneId },
      });
    });

    // Dossiers de coupure imminente
    const pendingCoupures = coupures.filter((c) => ['PROPOSE', 'VALIDEE'].includes(c.statut));
    pendingCoupures.forEach((c) => {
      list.push({
        id: `coupure-${c.id}`,
        category: 'RETARD',
        severity: 'CRITIQUE',
        title: `Procédure de coupure : ${c.abonneNom} (${c.abonneCode})`,
        subtitle: `Quartier ${c.abonneQuartier} • Retard > ${c.delaiJours} jours`,
        description: `Dossier d'interruption formelle de desserte d'eau ouvert pour non-règlement répété (${c.montantDetteFCFA.toLocaleString('fr-FR')} FCFA). Statut: ${c.statut}.`,
        dateStr: `Dossier du ${c.dateProposition}`,
        location: c.abonneQuartier,
        metricLabel: 'Dette cumulée',
        metricValue: `${c.montantDetteFCFA.toLocaleString('fr-FR')} FCFA`,
        metricColor: 'text-rose-700',
        actionLabel: 'Gérer la coupure',
        targetModule: 'coupures',
        metadata: { coupureId: c.id, abonneId: c.abonneId },
      });
    });

    // 4. STOCKS CRITIQUES & ALERTE (Chlore, Compteurs neufs, Pièces de sécurité)
    const allStocks = store.getStocks();
    allStocks.forEach((s) => {
      const statut = store.getStatutNiveauStock(s);
      if (statut === 'CRITIQUE' || statut === 'RUPTURE') {
        list.push({
          id: `stock-${s.id}`,
          category: 'STOCK',
          severity: 'CRITIQUE',
          title: `Stock critique : ${s.nom}`,
          subtitle: `${s.emplacement} • Seuil critique: ${s.seuilCritique} ${s.unite}`,
          description: `Quantité restante (${s.quantiteActuelle} ${s.unite}) inférieure ou égale au seuil critique (${s.seuilCritique} ${s.unite}). Risque d'interruption de traitement. Alerte transmise à ${s.destinataireAlerte}.`,
          dateStr: s.derniereMiseAJour || "Aujourd'hui",
          location: s.forageNom || 'Magasin Central ASUFOR',
          metricLabel: 'Réserve critique',
          metricValue: `${s.quantiteActuelle} / ${s.seuilCritique} ${s.unite}`,
          metricColor: 'text-rose-600',
          actionLabel: 'Gérer les stocks',
          targetModule: 'production',
        });
      } else if (statut === 'ALERTE') {
        list.push({
          id: `stock-${s.id}`,
          category: 'STOCK',
          severity: 'HAUTE',
          title: `Alerte approvisionnement : ${s.nom}`,
          subtitle: `${s.emplacement} • Fournisseur: ${s.fournisseurNom}`,
          description: `Stock à ${s.quantiteActuelle} ${s.unite} sous le seuil d'alerte (${s.seuilAlerte} ${s.unite}). Commander auprès de ${s.fournisseurNom} (${s.fournisseurContact}).`,
          dateStr: s.derniereMiseAJour || "Aujourd'hui",
          location: s.forageNom || 'Magasin Central ASUFOR',
          metricLabel: 'Niveau bas',
          metricValue: `${s.quantiteActuelle} ${s.unite}`,
          metricColor: 'text-amber-600',
          actionLabel: 'Voir le stock',
          targetModule: 'production',
        });
      }
    });

    // Sort by severity (CRITIQUE first, then HAUTE, MOYENNE, INFO)
    const severityWeight: Record<AlertSeverity, number> = {
      CRITIQUE: 4,
      HAUTE: 3,
      MOYENNE: 2,
      INFO: 1,
    };

    return list.sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity]);
  }, [pannes, factures, coupures, releves, bilanProd]);

  // Counts by category
  const counts = useMemo(() => {
    return {
      all: allAlerts.length,
      pannes: allAlerts.filter((a) => a.category === 'PANNE').length,
      fuites: allAlerts.filter((a) => a.category === 'FUITE').length,
      retards: allAlerts.filter((a) => a.category === 'RETARD').length,
      stocks: allAlerts.filter((a) => a.category === 'STOCK').length,
      critiques: allAlerts.filter((a) => a.severity === 'CRITIQUE').length,
    };
  }, [allAlerts]);

  // Filtered alerts according to active tab
  const filteredAlerts = useMemo(() => {
    if (activeTab === 'ALL') return allAlerts;
    return allAlerts.filter((a) => a.category === activeTab);
  }, [allAlerts, activeTab]);

  // Display top alerts when not expanded
  const displayedAlerts = expanded ? filteredAlerts : filteredAlerts.slice(0, 4);

  // Styling helper for category icons
  const getCategoryIcon = (category: UnifiedAlert['category']) => {
    switch (category) {
      case 'PANNE':
        return <Wrench className="w-4 h-4 text-amber-500" />;
      case 'FUITE':
        return <Droplets className="w-4 h-4 text-cyan-500" />;
      case 'RETARD':
        return <Receipt className="w-4 h-4 text-rose-500" />;
      case 'STOCK':
        return <Boxes className="w-4 h-4 text-purple-500" />;
    }
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'CRITIQUE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <Flame className="w-3 h-3 text-rose-600 animate-pulse" />
            CRITIQUE
          </span>
        );
      case 'HAUTE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            HAUTE
          </span>
        );
      case 'MOYENNE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
            MOYENNE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            INFO
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-200">
      {/* Widget Header Banner */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-900">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                counts.critiques > 0
                  ? 'bg-rose-500/10 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                  : 'bg-amber-500/10 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-900'
              }`}
            >
              {counts.critiques > 0 ? (
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-[#082F49] dark:text-white">
                  Centre d'Alertes Actives & Risques Opérationnels
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-black font-mono ${
                    counts.all > 0
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'bg-emerald-500 text-white'
                  }`}
                >
                  {counts.all}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Surveillance centralisée en temps réel : pannes électromécaniques, fuites réseau et impayés en retard.
              </p>
            </div>
          </div>

          {/* Quick mini KPIs summary */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/50 text-xs">
              <Wrench className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-slate-600 dark:text-slate-400">Pannes :</span>
              <strong className="text-amber-700 dark:text-amber-300 font-mono font-bold">
                {counts.pannes}
              </strong>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200/60 dark:border-cyan-900/50 text-xs">
              <Droplets className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span className="text-slate-600 dark:text-slate-400">Fuites/Pertes :</span>
              <strong className="text-cyan-700 dark:text-cyan-300 font-mono font-bold">
                {counts.fuites}
              </strong>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/50 text-xs">
              <Receipt className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span className="text-slate-600 dark:text-slate-400">Retards :</span>
              <strong className="text-rose-700 dark:text-rose-300 font-mono font-bold">
                {counts.retards}
              </strong>
            </div>

            {/* Quick Action Button to Report Breakdown/Leak */}
            <button
              onClick={() => onNavigate('pannes')}
              className="ml-auto lg:ml-2 px-3 py-1.5 rounded-xl bg-[#082F49] hover:bg-[#0c4a75] text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5 text-cyan-300" />
              <span>Gérer les pannes</span>
            </button>
          </div>
        </div>

        {/* Category Tabs Filter */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-[#082F49] text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <span>Toutes les alertes</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('PANNE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'PANNE'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Pannes ({counts.pannes})</span>
          </button>

          <button
            onClick={() => setActiveTab('FUITE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'FUITE'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Fuites & Pertes ({counts.fuites})</span>
          </button>

          <button
            onClick={() => setActiveTab('RETARD')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'RETARD'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Paiements en retard ({counts.retards})</span>
          </button>

          <button
            onClick={() => setActiveTab('STOCK')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'STOCK'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Stocks Critiques ({counts.stocks})</span>
          </button>

          {/* Quick links to dedicated modules */}
          <div className="ml-auto hidden md:flex items-center gap-3 text-xs text-slate-500">
            <button
              onClick={() => onNavigate('coupures')}
              className="hover:text-cyan-600 dark:hover:text-cyan-400 font-semibold cursor-pointer flex items-center gap-1"
            >
              <span>Relances & Coupures</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <span>•</span>
            <button
              onClick={() => onNavigate('production')}
              className="hover:text-cyan-600 dark:hover:text-cyan-400 font-semibold cursor-pointer flex items-center gap-1"
            >
              <span>Bilan Hydraulique</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Alert Items List */}
      <div className="p-5">
        {filteredAlerts.length === 0 ? (
          <div className="py-8 text-center bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
              Aucune alerte active dans cette catégorie
            </h4>
            <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-1 max-w-md mx-auto">
              Tous les équipements sont opérationnels, le réseau ne présente pas de fuite anormale et les factures sont à jour.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <AnimatePresence>
              {displayedAlerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    alert.severity === 'CRITIQUE'
                      ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/70 hover:border-rose-300'
                      : alert.severity === 'HAUTE'
                      ? 'bg-amber-50/30 dark:bg-amber-950/15 border-amber-200 dark:border-amber-900/60 hover:border-amber-300'
                      : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-cyan-300 dark:hover:border-cyan-800'
                  }`}
                >
                  <div>
                    {/* Top line: Category icon, severity badge, date */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 shadow-xs border border-slate-200/60 dark:border-slate-700 flex items-center justify-center">
                          {getCategoryIcon(alert.category)}
                        </div>
                        {getSeverityBadge(alert.severity)}
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          {alert.category === 'PANNE' && 'Panne'}
                          {alert.category === 'FUITE' && 'Fuite & Pertes'}
                          {alert.category === 'RETARD' && 'Recouvrement'}
                        </span>
                      </div>

                      <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                        {alert.dateStr}
                      </span>
                    </div>

                    {/* Alert Title & Subtitle */}
                    <h4 className="text-sm font-extrabold text-[#082F49] dark:text-white leading-snug">
                      {alert.title}
                    </h4>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                      {alert.subtitle}
                    </p>

                    {/* Description */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">
                      {alert.description}
                    </p>
                  </div>

                  {/* Bottom Line: Key Metric + Direct Action Button */}
                  <div className="mt-3.5 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between gap-2">
                    <div>
                      {alert.metricLabel && (
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                          {alert.metricLabel}
                        </div>
                      )}
                      {alert.metricValue && (
                        <div className={`text-xs font-extrabold font-mono ${alert.metricColor || 'text-slate-800 dark:text-white'}`}>
                          {alert.metricValue}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => onNavigate(alert.targetModule)}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#082F49] dark:text-cyan-300 border border-slate-200 dark:border-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                    >
                      <span>{alert.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-cyan-500" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Toggle Expand / Collapse when there are more than 4 alerts */}
        {filteredAlerts.length > 4 && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              onClick={() => setExpanded(!expanded)}
              className="px-4 py-1.5 rounded-xl text-xs font-bold text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span>Réduire la liste ({filteredAlerts.length} alertes)</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span>Afficher toutes les alertes ({filteredAlerts.length})</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Informative Footer Bar */}
      <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
          <span>
            Les coupures d'eau sont soumises à préavis réglementaire de 48h et validation humaine expresse.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigate('sms-alerts')}
            className="text-cyan-700 dark:text-cyan-400 hover:underline font-semibold cursor-pointer"
          >
            Configurer alertes SMS passerelle
          </button>
        </div>
      </div>
    </div>
  );
};
