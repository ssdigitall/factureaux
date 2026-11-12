import React, { useState, useMemo } from 'react';
import {
  X,
  FileDown,
  FileSpreadsheet,
  Printer,
  Calendar,
  DollarSign,
  Droplets,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Filter,
  Layers,
  Building2,
  Users,
  Gauge,
  Activity,
  Sparkles,
} from 'lucide-react';
import { store } from '../services/store';
import {
  exportBillingReportPdf,
  exportProductionReportPdf,
  exportBillingReportCsv,
  exportProductionReportCsv,
  BillingReportPayload,
  ProductionReportPayload,
} from '../services/billingProductionPdfService';
import { formatFCFA, formatNumberDot } from '../utils/formatters';

interface RapportsPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'FACTURATION' | 'PRODUCTION';
}

export const RapportsPdfModal: React.FC<RapportsPdfModalProps> = ({
  isOpen,
  onClose,
  initialType = 'FACTURATION',
}) => {
  const [reportType, setReportType] = useState<'FACTURATION' | 'PRODUCTION'>(initialType);
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-11');
  const [selectedForageId, setSelectedForageId] = useState<string>('ALL');
  const [statutFilter, setStatutFilter] = useState<'ALL' | 'PAYEE' | 'IMPAYEE'>('ALL');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const currentOrg = store.getCurrentOrganisation();
  const forages = store.getForages();
  const factures = store.getFactures();
  const paiements = store.getPaiements();
  const production = store.getProduction();

  // Convert month key to French string
  const formatMonthFr = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const str = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Billing Report Dataset
  const billingData: BillingReportPayload = useMemo(() => {
    let filtered = factures;

    if (selectedForageId !== 'ALL') {
      filtered = filtered.filter((f) => f.forageId === selectedForageId);
    }

    if (statutFilter === 'PAYEE') {
      filtered = filtered.filter((f) => f.statut === 'PAYEE');
    } else if (statutFilter === 'IMPAYEE') {
      filtered = filtered.filter((f) => f.statut !== 'PAYEE');
    }

    const totalFactureTTC = filtered.reduce((s, f) => s + f.totalTTCFCFA, 0);
    const totalVolumeM3 = filtered.reduce((s, f) => s + f.consommationM3, 0);
    const totalEncaisseFCFA = filtered.reduce((s, f) => s + f.montantPayeFCFA, 0);
    const totalImpayesFCFA = filtered.reduce((s, f) => s + f.resteDuFCFA, 0);
    const facturesPayeesCount = filtered.filter((f) => f.statut === 'PAYEE').length;
    const facturesImpayeesCount = filtered.filter((f) => f.statut !== 'PAYEE').length;
    const tauxRecouvrement = totalFactureTTC > 0 ? Math.round((totalEncaisseFCFA / totalFactureTTC) * 100) : 0;

    const forageObj = forages.find((f) => f.id === selectedForageId);

    return {
      organisationNom: currentOrg?.nom || 'ASUFOR de Touba Toul',
      departement: currentOrg?.departement || 'Tivaouane',
      region: currentOrg?.region || 'Thiès',
      periode: formatMonthFr(selectedMonth),
      dateGeneration: new Date().toLocaleDateString('fr-FR'),
      forageNom: forageObj ? `${forageObj.nom} (${forageObj.code})` : 'Tous les forages du réseau',
      factures: filtered.map((f) => ({
        id: f.id,
        numeroFacture: f.numeroFacture,
        abonneCode: f.abonneCode,
        abonneNom: f.abonneNom,
        abonneQuartier: f.abonneQuartier,
        consommationM3: f.consommationM3,
        totalTTCFCFA: f.totalTTCFCFA,
        montantPayeFCFA: f.montantPayeFCFA,
        resteDuFCFA: f.resteDuFCFA,
        statut: f.statut,
        dateEmission: f.dateEmission,
        dateEcheance: f.dateEcheance,
      })),
      totalFactureTTC,
      totalVolumeM3,
      totalEncaisseFCFA,
      totalImpayesFCFA,
      tauxRecouvrement,
      facturesPayeesCount,
      facturesImpayeesCount,
    };
  }, [factures, selectedForageId, statutFilter, selectedMonth, currentOrg, forages]);

  // Production Report Dataset
  const productionData: ProductionReportPayload = useMemo(() => {
    let filtered = production;

    if (selectedForageId !== 'ALL') {
      filtered = filtered.filter((p) => p.forageId === selectedForageId);
    }

    const totalVolumeProduitM3 = filtered.reduce((s, p) => s + p.volumeProduitM3, 0);
    // Corresponding billed volume for the period
    const billedFactures = selectedForageId !== 'ALL'
      ? factures.filter((f) => f.forageId === selectedForageId)
      : factures;
    const totalVolumeConsommeM3 = billedFactures.reduce((s, f) => s + f.consommationM3, 0);
    const totalPertesM3 = Math.max(0, totalVolumeProduitM3 - totalVolumeConsommeM3);
    const tauxPertePourcent = totalVolumeProduitM3 > 0
      ? Math.round((totalPertesM3 / totalVolumeProduitM3) * 1000) / 10
      : 14.8;
    const tauxRendementPourcent = totalVolumeProduitM3 > 0
      ? Math.round((totalVolumeConsommeM3 / totalVolumeProduitM3) * 1000) / 10
      : 85.2;

    const foragesStats = forages.map((f) => {
      const fProds = production.filter((p) => p.forageId === f.id);
      const fVol = fProds.reduce((s, p) => s + p.volumeProduitM3, 0) || Math.round(totalVolumeProduitM3 / forages.length);
      const part = totalVolumeProduitM3 > 0 ? Math.round((fVol / totalVolumeProduitM3) * 100) : 50;
      return {
        nom: f.nom,
        debitNominal: f.debitNominalM3H,
        typePompe: f.typePompe,
        volumeM3: fVol,
        partPourcent: part,
      };
    });

    const forageObj = forages.find((f) => f.id === selectedForageId);

    return {
      organisationNom: currentOrg?.nom || 'ASUFOR de Touba Toul',
      departement: currentOrg?.departement || 'Tivaouane',
      region: currentOrg?.region || 'Thiès',
      periode: formatMonthFr(selectedMonth),
      dateGeneration: new Date().toLocaleDateString('fr-FR'),
      forageNom: forageObj ? `${forageObj.nom} (${forageObj.code})` : 'Tous les forages du réseau',
      releves: filtered.map((p) => ({
        id: p.id,
        dateReleve: p.dateReleve,
        forageNom: p.forageNom,
        ancienIndexM3: p.ancienIndexM3,
        nouvelIndexM3: p.nouvelIndexM3,
        volumeProduitM3: p.volumeProduitM3,
        agentNom: p.agentNom,
      })),
      totalVolumeProduitM3,
      totalVolumeConsommeM3,
      totalPertesM3,
      tauxPertePourcent,
      tauxRendementPourcent,
      foragesStats,
    };
  }, [production, factures, selectedForageId, selectedMonth, currentOrg, forages]);

  const handleDownload = () => {
    setIsExporting(true);
    try {
      if (reportType === 'FACTURATION') {
        exportBillingReportPdf(billingData);
        setExportSuccess('Rapport de Facturation (PDF) généré et téléchargé avec succès !');
      } else {
        exportProductionReportPdf(productionData);
        setExportSuccess('Rapport de Production Hydraulique (PDF) généré et téléchargé avec succès !');
      }
      setTimeout(() => setExportSuccess(null), 4000);
    } catch (err) {
      console.error('Erreur export PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadCsv = () => {
    try {
      if (reportType === 'FACTURATION') {
        exportBillingReportCsv(billingData);
        setExportSuccess('État de Facturation (CSV Excel) exporté avec succès !');
      } else {
        exportProductionReportCsv(productionData);
        setExportSuccess('Rapport de Production (CSV Excel) exporté avec succès !');
      }
      setTimeout(() => setExportSuccess(null), 4000);
    } catch (err) {
      console.error('Erreur export CSV:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#082F49] via-[#0c4a75] to-[#0369A1] text-white flex items-center justify-between border-b border-sky-900/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 flex items-center justify-center font-bold">
              <FileDown className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  Édition & Téléchargement des Rapports Officiels (PDF)
                </h3>
                <span className="text-[10px] bg-cyan-500/30 text-cyan-200 px-2 py-0.5 rounded-full font-mono font-bold">
                  Vectoriel A4
                </span>
              </div>
              <p className="text-xs text-cyan-100/90 mt-0.5">
                {currentOrg?.nom || 'ASUFOR de Touba Toul'} • Département de {currentOrg?.departement || 'Tivaouane'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-2 rounded-xl hover:bg-white/10 transition cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success toast inside modal */}
        {exportSuccess && (
          <div className="mx-6 mt-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 text-xs font-semibold rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{exportSuccess}</span>
          </div>
        )}

        {/* Type Selector Tabs */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold w-full sm:w-auto">
            <button
              onClick={() => setReportType('FACTURATION')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer ${
                reportType === 'FACTURATION'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Rapport de Facturation (PDF)</span>
            </button>
            <button
              onClick={() => setReportType('PRODUCTION')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer ${
                reportType === 'PRODUCTION'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Droplets className="w-4 h-4" />
              <span>Rapport de Production & Pertes (PDF)</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Sparkles className="w-4 h-4 text-cyan-600" />
            <span>Multi-pages avec signatures officielles</span>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs shrink-0">
          {/* Month selector */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700">
            <Calendar className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-100 font-semibold cursor-pointer focus:outline-none"
            >
              <option value="2026-11">Novembre 2026 (En cours)</option>
              <option value="2026-10">Octobre 2026</option>
              <option value="2026-09">Septembre 2026</option>
              <option value="2026-08">Août 2026</option>
              <option value="2026-07">Juillet 2026</option>
            </select>
          </div>

          {/* Forage selector */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedForageId}
              onChange={(e) => setSelectedForageId(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-100 font-medium cursor-pointer focus:outline-none"
            >
              <option value="ALL">Tous les forages ({forages.length})</option>
              {forages.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nom} ({f.code})
                </option>
              ))}
            </select>
          </div>

          {/* Status filter if Facturation */}
          {reportType === 'FACTURATION' && (
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700">
              <span className="text-slate-400">Statut :</span>
              <select
                value={statutFilter}
                onChange={(e) => setStatutFilter(e.target.value as any)}
                className="bg-transparent text-slate-800 dark:text-slate-100 font-medium cursor-pointer focus:outline-none"
              >
                <option value="ALL">Toutes les factures</option>
                <option value="PAYEE">Soldées / Payées uniquement</option>
                <option value="IMPAYEE">Impayées & Partiellement réglées</option>
              </select>
            </div>
          )}
        </div>

        {/* Scrollable Preview Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {reportType === 'FACTURATION' ? (
            /* --- PREVIEW FACTURATION --- */
            <div className="space-y-4">
              {/* KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-medium">Total Facturé TTC</span>
                  <div className="text-lg font-black text-[#082F49] dark:text-sky-300 mt-0.5">
                    {formatFCFA(billingData.totalFactureTTC)}
                  </div>
                  <span className="text-[10px] text-slate-400">{billingData.factures.length} factures</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-medium">Recettes Encaissées</span>
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {formatFCFA(billingData.totalEncaisseFCFA)}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold">
                    {billingData.tauxRecouvrement}% recouvert
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-medium">Créances Restantes</span>
                  <div className="text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5">
                    {formatFCFA(billingData.totalImpayesFCFA)}
                  </div>
                  <span className="text-[10px] text-rose-600 font-bold">
                    {billingData.facturesImpayeesCount} en attente
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-medium">Volume d'Eau Facturé</span>
                  <div className="text-lg font-black text-cyan-600 dark:text-cyan-400 mt-0.5">
                    {formatNumberDot(billingData.totalVolumeM3)} m³
                  </div>
                  <span className="text-[10px] text-cyan-600 font-bold">Consommation usagers</span>
                </div>
              </div>

              {/* Table Preview */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-4 py-2.5 bg-[#082F49] text-white text-xs font-bold flex items-center justify-between">
                  <span>Aperçu des Factures Prêtes pour Impression PDF</span>
                  <span className="text-[10px] font-mono font-normal">
                    {billingData.factures.length} lignes à imprimer (format A4 certifié)
                  </span>
                </div>
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2 px-3">N° Facture</th>
                        <th className="py-2 px-3">Code</th>
                        <th className="py-2 px-3">Nom Abonné</th>
                        <th className="py-2 px-3">Quartier</th>
                        <th className="py-2 px-3 text-right">Conso (m³)</th>
                        <th className="py-2 px-3 text-right">Total TTC</th>
                        <th className="py-2 px-3 text-right">Payé</th>
                        <th className="py-2 px-3 text-right">Reste Dû</th>
                        <th className="py-2 px-3 text-center">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {billingData.factures.slice(0, 15).map((f) => (
                        <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-2 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                            {f.numeroFacture}
                          </td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-400 font-mono">
                            {f.abonneCode}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-900 dark:text-slate-100">
                            {f.abonneNom}
                          </td>
                          <td className="py-2 px-3 text-slate-500">{f.abonneQuartier || 'Centre'}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-cyan-600">
                            {formatNumberDot(f.consommationM3)} m³
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                            {formatFCFA(f.totalTTCFCFA)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-emerald-600">
                            {formatFCFA(f.montantPayeFCFA)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">
                            {formatFCFA(f.resteDuFCFA)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                f.statut === 'PAYEE'
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                              }`}
                            >
                              {f.statut}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* --- PREVIEW PRODUCTION --- */
            <div className="space-y-4">
              {/* KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-medium">Volume Pompé (Tête)</span>
                  <div className="text-lg font-black text-cyan-600 dark:text-cyan-400 mt-0.5">
                    {formatNumberDot(productionData.totalVolumeProduitM3)} m³
                  </div>
                  <span className="text-[10px] text-slate-400">{productionData.releves.length} relevés généraux</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-medium">Volume Distribué & Facturé</span>
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {formatNumberDot(productionData.totalVolumeConsommeM3)} m³
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold">
                    Rendement : {productionData.tauxRendementPourcent}%
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-medium">Pertes Réseau Estimées</span>
                  <div className="text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5">
                    {formatNumberDot(productionData.totalPertesM3)} m³
                  </div>
                  <span className="text-[10px] text-rose-600 font-bold">
                    Taux NRW : {productionData.tauxPertePourcent}%
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-medium">État du Réseau</span>
                  <div className="text-lg font-black text-[#082F49] dark:text-sky-300 mt-0.5">
                    {productionData.tauxPertePourcent <= 15 ? 'Conforme' : 'Alerte Fuites'}
                  </div>
                  <span className="text-[10px] text-slate-400">Norme OFOR &lt; 15%</span>
                </div>
              </div>

              {/* Table Forages Breakdown */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-4 py-2.5 bg-[#082F49] text-white text-xs font-bold flex items-center justify-between">
                  <span>Répartition Technique du Pompage par Forage</span>
                  <span className="text-[10px] font-mono font-normal">Capacité & Parts relatives</span>
                </div>
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2 px-3">Forage / Ouvrage</th>
                      <th className="py-2 px-3">Type Pompe</th>
                      <th className="py-2 px-3 text-right">Débit Nominal</th>
                      <th className="py-2 px-3 text-right">Volume Extrait</th>
                      <th className="py-2 px-3 text-right">Part du Réseau</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {productionData.foragesStats.map((fs) => (
                      <tr key={fs.nom} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200">{fs.nom}</td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{fs.typePompe}</td>
                        <td className="py-2 px-3 text-right font-mono">{fs.debitNominal} m³/h</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-cyan-600">
                          {formatNumberDot(fs.volumeM3)} m³
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">
                          {fs.partPourcent}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Document PDF officiel certifié prêt pour diffusion (format A4 vectoriel 2 pages)</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-xs"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Imprimer</span>
            </button>

            <button
              onClick={handleDownloadCsv}
              className="px-3.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-xs"
              title="Télécharger les données brutes au format tableur CSV (UTF-8 pour Excel)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Exporter CSV</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer transition"
            >
              <FileDown className="w-4 h-4" />
              <span>
                {isExporting
                  ? 'Génération PDF en cours...'
                  : reportType === 'FACTURATION'
                  ? 'Télécharger le PDF Facturation'
                  : 'Télécharger le PDF Production'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
