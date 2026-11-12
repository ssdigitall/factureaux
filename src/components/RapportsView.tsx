import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Droplets,
  Receipt,
  Users,
  FileSpreadsheet,
  FileDown,
} from 'lucide-react';
import { store } from '../services/store';
import { RapportMensuelModal } from './RapportMensuelModal';
import { RapportsPdfModal } from './RapportsPdfModal';
import {
  exportBillingReportCsv,
  exportProductionReportCsv,
  BillingReportPayload,
  ProductionReportPayload,
} from '../services/billingProductionPdfService';
import { exportMonthlyFinancialReportCsv } from '../services/monthlyPdfReportService';

export const RapportsView: React.FC = () => {
  const [periode, setPeriode] = useState<'MOIS' | 'TRIMESTRE' | 'ANNEE'>('MOIS');
  const [showMonthlyModal, setShowMonthlyModal] = useState<boolean>(false);
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);
  const [pdfModalType, setPdfModalType] = useState<'FACTURATION' | 'PRODUCTION'>('FACTURATION');

  const factures = store.getFactures();
  const paiements = store.getPaiements();
  const depenses = store.getDepenses().filter((d) => d.statut === 'VALIDEE');
  const comptes = store.getComptes();
  const abonnes = store.getAbonnes();
  const forages = store.getForages();
  const bilanEau = store.getBilanProduction();
  const currentOrg = store.getCurrentOrganisation();

  const totalRecettes = paiements.reduce((sum, p) => sum + p.montantFCFA, 0);
  const totalDepenses = depenses.reduce((sum, d) => sum + d.montantFCFA, 0);
  const resultatNetExploitation = totalRecettes - totalDepenses;
  const soldeTresorerieGlobal = comptes.reduce((sum, c) => sum + c.soldeActuelFCFA, 0);
  const totalImpayes = factures.reduce((sum, f) => sum + f.resteDuFCFA, 0);

  const handleExportBillingCsv = () => {
    const totalFactureTTC = factures.reduce((s, f) => s + f.totalTTCFCFA, 0);
    const totalVolumeM3 = factures.reduce((s, f) => s + f.consommationM3, 0);
    const totalEncaisseFCFA = factures.reduce((s, f) => s + f.montantPayeFCFA, 0);
    const totalImpayesFCFA = factures.reduce((s, f) => s + f.resteDuFCFA, 0);
    const facturesPayeesCount = factures.filter((f) => f.statut === 'PAYEE').length;
    const facturesImpayeesCount = factures.filter((f) => f.statut !== 'PAYEE').length;
    const tauxRecouvrement = totalFactureTTC > 0 ? Math.round((totalEncaisseFCFA / totalFactureTTC) * 100) : 0;

    exportBillingReportCsv({
      organisationNom: currentOrg?.nom || 'ASUFOR de Touba Toul',
      departement: currentOrg?.departement || 'Tivaouane',
      region: currentOrg?.region || 'Thiès',
      periode: 'Novembre 2026',
      dateGeneration: new Date().toLocaleDateString('fr-FR'),
      forageNom: 'Tous les forages du réseau',
      factures: factures.map((f) => ({
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
    });
  };

  const handleExportProductionCsv = () => {
    const production = store.getProduction();
    const totalVolumeProduitM3 = production.reduce((s, p) => s + p.volumeProduitM3, 0);
    const totalVolumeConsommeM3 = factures.reduce((s, f) => s + f.consommationM3, 0);
    const totalPertesM3 = Math.max(0, totalVolumeProduitM3 - totalVolumeConsommeM3);
    const tauxPertePourcent =
      totalVolumeProduitM3 > 0 ? Math.round((totalPertesM3 / totalVolumeProduitM3) * 1000) / 10 : 14.8;
    const tauxRendementPourcent =
      totalVolumeProduitM3 > 0 ? Math.round((totalVolumeConsommeM3 / totalVolumeProduitM3) * 1000) / 10 : 85.2;

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

    exportProductionReportCsv({
      organisationNom: currentOrg?.nom || 'ASUFOR de Touba Toul',
      departement: currentOrg?.departement || 'Tivaouane',
      region: currentOrg?.region || 'Thiès',
      periode: 'Novembre 2026',
      dateGeneration: new Date().toLocaleDateString('fr-FR'),
      forageNom: 'Tous les forages du réseau',
      releves: production.map((p) => ({
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
    });
  };

  const handleExportMonthlyFinancialCsv = () => {
    const data = store.getRapportFinancierMensuel('2026-11');
    exportMonthlyFinancialReportCsv(data);
  };

  const handleExportCSV = () => {
    const csvContent =
      'Type,Indicateur,Valeur_FCFA_ou_M3\n' +
      `Organisation,${currentOrg?.nom || 'ASUFOR'},-\n` +
      `Periode,${periode},-\n` +
      `Recettes_Totales,Paiements_Encaisses,${totalRecettes}\n` +
      `Depenses_Validees,Decaissements,${totalDepenses}\n` +
      `Resultat_Net,Marge_Exploitation,${resultatNetExploitation}\n` +
      `Solde_Tresorerie,Tous_Comptes,${soldeTresorerieGlobal}\n` +
      `Creances_Impayees,Reste_A_Recouvrer,${totalImpayes}\n` +
      `Volume_Eau_Pompe_M3,Production,${bilanEau.volumeProduitM3}\n` +
      `Volume_Eau_Facture_M3,Consommation,${bilanEau.volumeConsommeM3}\n` +
      `Pertes_Eau_M3,Non_Comptabilise,${bilanEau.perteVolumeM3}\n` +
      `Taux_Pertes_Pourcent,NRW,${bilanEau.tauxPertePourcent || 0}%\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Rapport_Financier_Hydraulique_${periode}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#082F49] dark:text-sky-300 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            Rapports Périodiques & États Financiers
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Bilan d'exploitation, compte de résultat, indicateurs de trésorerie et balance hydraulique.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Periode filter */}
          <div className="inline-flex items-center p-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setPeriode('MOIS')}
              className={`px-3 py-1.5 rounded-lg transition ${
                periode === 'MOIS' ? 'bg-[#082F49] dark:bg-sky-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Mois en cours
            </button>
            <button
              onClick={() => setPeriode('TRIMESTRE')}
              className={`px-3 py-1.5 rounded-lg transition ${
                periode === 'TRIMESTRE' ? 'bg-[#082F49] dark:bg-sky-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Trimestre
            </button>
            <button
              onClick={() => setPeriode('ANNEE')}
              className={`px-3 py-1.5 rounded-lg transition ${
                periode === 'ANNEE' ? 'bg-[#082F49] dark:bg-sky-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Année 2026
            </button>
          </div>

          <button
            onClick={() => {
              setPdfModalType('FACTURATION');
              setShowPdfModal(true);
            }}
            className="bg-sky-700 hover:bg-sky-600 text-white px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer shrink-0"
            title="Générer et télécharger le rapport officiel de facturation nominatif en PDF"
          >
            <Receipt className="w-3.5 h-3.5 text-cyan-200" />
            <span>Facturation (PDF)</span>
          </button>

          <button
            onClick={() => {
              setPdfModalType('PRODUCTION');
              setShowPdfModal(true);
            }}
            className="bg-cyan-700 hover:bg-cyan-600 text-white px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer shrink-0"
            title="Générer et télécharger le rapport technique de production d'eau et de pertes réseau en PDF"
          >
            <Droplets className="w-3.5 h-3.5 text-cyan-200" />
            <span>Production (PDF)</span>
          </button>

          <button
            onClick={() => setShowMonthlyModal(true)}
            className="bg-[#082F49] hover:bg-sky-900 dark:bg-sky-800 text-white px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer shrink-0"
            title="Générer le rapport financier mensuel officiel complet au format PDF (factures, paiements, dépenses)"
          >
            <FileDown className="w-3.5 h-3.5 text-cyan-200" />
            <span>Bilan Mensuel (PDF)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Exporter CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="bg-[#082F49] hover:bg-sky-900 dark:bg-sky-700 dark:hover:bg-sky-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>Imprimer</span>
          </button>
        </div>
      </div>

      {/* Financial Statement Report */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 px-2.5 py-1 rounded-full border border-cyan-200 dark:border-cyan-800">
              Rapport d'Exploitation {periode}
            </span>
            <h3 className="text-xl font-extrabold text-[#082F49] dark:text-sky-300 mt-2">
              {currentOrg?.nom || 'ASUFOR de Touba Toul'}
            </h3>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Département de {currentOrg?.departement || 'Tivaouane'} • Région de {currentOrg?.region || 'Thiès'}
            </div>
          </div>
          <div className="text-right text-xs font-mono text-slate-400 dark:text-slate-500">
            Généré le {new Date().toLocaleDateString('fr-FR')}
          </div>
        </div>

        {/* Financial KPI Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Total Recettes Encaissées</span>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
              +{totalRecettes.toLocaleString('fr-FR')} FCFA
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Total Dépenses Décaissées</span>
            <div className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono mt-1">
              -{totalDepenses.toLocaleString('fr-FR')} FCFA
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Résultat Net d'Exploitation</span>
            <div className={`text-xl font-black font-mono mt-1 ${resultatNetExploitation >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
              {resultatNetExploitation >= 0 ? '+' : ''}{resultatNetExploitation.toLocaleString('fr-FR')} FCFA
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Liquidités en Caisse & Banque</span>
            <div className="text-xl font-black text-cyan-700 dark:text-cyan-400 font-mono mt-1">
              {soldeTresorerieGlobal.toLocaleString('fr-FR')} FCFA
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Tables */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {/* Breakdown by Expense Category */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-white dark:bg-slate-900">
            <h4 className="text-sm font-bold text-[#082F49] dark:text-sky-300 mb-3">Ventilation des Dépenses par Poste</h4>
            <div className="space-y-2.5 text-xs">
              {['CARBURANT', 'ELECTRICITE', 'REPARATION', 'SALAIRE', 'ENTRETIEN', 'REDEVANCE', 'AUTRE'].map((cat) => {
                const totalCat = depenses
                  .filter((d) => d.categorie === cat)
                  .reduce((sum, d) => sum + d.montantFCFA, 0);

                const pct = totalDepenses > 0 ? Math.round((totalCat / totalDepenses) * 100) : 0;

                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-slate-700 dark:text-slate-300">
                      <span>{cat}</span>
                      <strong className="font-mono">{totalCat.toLocaleString('fr-FR')} FCFA ({pct}%)</strong>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Water & Technical Balance */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-white dark:bg-slate-900">
            <h4 className="text-sm font-bold text-[#082F49] dark:text-sky-300 mb-3">Balance Technique & Rendement Réseau</h4>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-600 dark:text-slate-400">Volume produit en forage :</span>
                <strong className="font-mono text-slate-900 dark:text-slate-100">{bilanEau.volumeProduitM3} m³</strong>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-600 dark:text-slate-400">Volume facturé aux usagers :</span>
                <strong className="font-mono text-emerald-600 dark:text-emerald-400">{bilanEau.volumeConsommeM3} m³</strong>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-600 dark:text-slate-400">Pertes réseau estimées :</span>
                <strong className="font-mono text-rose-600 dark:text-rose-400">{bilanEau.perteVolumeM3} m³</strong>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 font-bold">
                <span className="text-cyan-900 dark:text-cyan-200">Taux de pertes global (NRW) :</span>
                <span className="font-mono text-cyan-900 dark:text-cyan-200">
                  {bilanEau.tauxPertePourcent !== null ? `${bilanEau.tauxPertePourcent}%` : 'Non calculable'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━ SECTION DÉDIÉE : CENTRE DE TÉLÉCHARGEMENT DES RAPPORTS PDF OFFICIELS ━━━━━━━━━━ */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-[#082F49] dark:text-sky-300 flex items-center gap-2">
              <FileDown className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              Centre d'Édition & Téléchargement des Rapports Officiels (PDF)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Documents réglementaires au format A4 vectoriel prêts pour audit, archivage et comités de gestion ASUFOR.
            </p>
          </div>
          <span className="text-[11px] font-mono text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-200 dark:border-cyan-800 font-bold shrink-0">
            Conforme Normes Hydrauliques Sénégal
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Facturation PDF */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-sky-50/60 to-white dark:from-slate-800/60 dark:to-slate-900 border border-sky-100 dark:border-slate-700 flex flex-col justify-between space-y-4 hover:border-cyan-400 transition shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-cyan-400 flex items-center justify-center font-bold">
                  <Receipt className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200">
                  {factures.length} Factures
                </span>
              </div>
              <h4 className="font-extrabold text-[#082F49] dark:text-sky-300 text-sm">
                Rapport Détaillé de Facturation
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                État nominatif complet : index compteurs, volumes consommés (m³), tranches tarifaires, règlements et reste à recouvrer.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setPdfModalType('FACTURATION');
                  setShowPdfModal(true);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-sky-700 hover:bg-sky-600 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                title="Générer et télécharger le rapport officiel de facturation en PDF format A4"
              >
                <FileDown className="w-4 h-4 text-cyan-200" />
                <span>Générer (PDF)</span>
              </button>

              <button
                onClick={handleExportBillingCsv}
                className="py-2.5 px-3 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                title="Exporter toutes les factures et règlements sous format CSV Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* Card 2: Production PDF */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-cyan-50/60 to-white dark:from-slate-800/60 dark:to-slate-900 border border-cyan-100 dark:border-slate-700 flex flex-col justify-between space-y-4 hover:border-cyan-400 transition shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 flex items-center justify-center font-bold">
                  <Droplets className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-200">
                  {bilanEau.volumeProduitM3} m³ Pompés
                </span>
              </div>
              <h4 className="font-extrabold text-[#082F49] dark:text-sky-300 text-sm">
                Rapport de Production & Pertes
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Relevés de tête de forage, balance hydraulique, indice NRW (Eau Non Comptabilisée), rendement réseau et alertes fuites.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setPdfModalType('PRODUCTION');
                  setShowPdfModal(true);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                title="Générer et télécharger le rapport technique de production d'eau en PDF format A4"
              >
                <FileDown className="w-4 h-4 text-cyan-200" />
                <span>Générer (PDF)</span>
              </button>

              <button
                onClick={handleExportProductionCsv}
                className="py-2.5 px-3 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                title="Exporter les relevés de production et balance hydraulique en CSV Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* Card 3: Bilan Mensuel PDF */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/60 dark:to-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-4 hover:border-cyan-400 transition shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#082F49] text-cyan-300 flex items-center justify-center font-bold">
                  <DollarSign className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono">
                  {totalRecettes.toLocaleString('fr-FR')} F
                </span>
              </div>
              <h4 className="font-extrabold text-[#082F49] dark:text-sky-300 text-sm">
                Rapport Financier Mensuel & Trésorerie
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Bilan comptable d'exploitation : recettes Wave/OM, décaissements validés, rapprochement de caisse et visas officiels.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMonthlyModal(true)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#082F49] hover:bg-sky-900 dark:bg-sky-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                title="Générer et télécharger le bilan mensuel officiel complet au format PDF"
              >
                <FileDown className="w-4 h-4 text-cyan-300" />
                <span>Bilan (PDF)</span>
              </button>

              <button
                onClick={handleExportMonthlyFinancialCsv}
                className="py-2.5 px-3 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                title="Exporter l'intégralité du bilan financier mensuel en CSV Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Rapport Facturation / Production PDF */}
      <RapportsPdfModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        initialType={pdfModalType}
      />

      {/* Modal Rapport Financier Mensuel */}
      <RapportMensuelModal
        isOpen={showMonthlyModal}
        onClose={() => setShowMonthlyModal(false)}
      />
    </div>
  );
};
