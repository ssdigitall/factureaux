import React, { useState } from 'react';
import {
  X,
  FileDown,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  FileText,
  CreditCard,
  Building2,
  Droplets,
  Layers,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { store } from '../services/store';
import {
  exportMonthlyFinancialReportPdf,
  exportMonthlyFinancialReportCsv,
} from '../services/monthlyPdfReportService';

interface RapportMensuelModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMonth?: string;
}

export const RapportMensuelModal: React.FC<RapportMensuelModalProps> = ({
  isOpen,
  onClose,
  initialMonth,
}) => {
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth || currentMonthStr);
  const [activeTab, setActiveTab] = useState<'SYNTHESE' | 'FACTURES' | 'PAIEMENTS' | 'DEPENSES'>('SYNTHESE');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const data = store.getRapportFinancierMensuel(selectedMonth);

  const handleExportPdf = () => {
    setIsExporting(true);
    try {
      exportMonthlyFinancialReportPdf(data);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3500);
    } catch (err) {
      console.error('Erreur export PDF mensuel:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCsv = () => {
    try {
      exportMonthlyFinancialReportCsv(data);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3500);
    } catch (err) {
      console.error('Erreur export CSV mensuel:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[94vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#082F49] via-[#0c4a75] to-[#0369A1] p-5 sm:p-6 text-white flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-400/20 text-cyan-300 flex items-center justify-center shrink-0 border border-cyan-400/30">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-400/30">
                  Rapport Financier Mensuel OHADA (PDF)
                </span>
                <span className="text-xs text-sky-200/90 hidden sm:inline">
                  {data.organisationNom}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-0.5">
                Bilan & États Financiers : {data.formattedMonthFr}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date Selector & Action Bar */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0 no-print">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Mois d'exercice :
            </span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            {selectedMonth !== currentMonthStr && (
              <button
                onClick={() => setSelectedMonth(currentMonthStr)}
                className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer ml-1"
              >
                Mois en cours
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Imprimer"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimer</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-emerald-300 dark:border-emerald-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Télécharger l'intégralité du bilan sous forme de tableur Excel CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Exporter CSV</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              <span>{isExporting ? 'Génération...' : 'Télécharger le PDF (2 Pages)'}</span>
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {exportSuccess && (
          <div className="bg-emerald-500 text-white px-4 py-2 text-xs font-bold flex items-center justify-between no-print">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>
                Le fichier <strong>Rapport_Financier_Mensuel_FACTUREAU_{selectedMonth}.pdf</strong> a été généré et téléchargé avec succès !
              </span>
            </div>
            <button onClick={() => setExportSuccess(false)} className="text-white hover:text-emerald-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center px-6 pt-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 gap-2 shrink-0 overflow-x-auto no-print">
          <button
            onClick={() => setActiveTab('SYNTHESE')}
            className={`py-2 px-3.5 border-b-2 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'SYNTHESE'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Synthèse & Ratios</span>
          </button>
          <button
            onClick={() => setActiveTab('FACTURES')}
            className={`py-2 px-3.5 border-b-2 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'FACTURES'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Factures ({data.factures.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('PAIEMENTS')}
            className={`py-2 px-3.5 border-b-2 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'PAIEMENTS'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <TrendingDown className="w-4 h-4 text-emerald-500" />
            <span>Paiements Encaissés ({data.paiements.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('DEPENSES')}
            className={`py-2 px-3.5 border-b-2 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'DEPENSES'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-rose-500" />
            <span>Dépenses Validées ({data.depenses.length})</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-800 dark:text-slate-200">
          {/* TAB 1: SYNTHÈSE */}
          {activeTab === 'SYNTHESE' && (
            <div className="space-y-6">
              {/* 4 Macro KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-sky-50/70 dark:bg-sky-950/40 p-4 rounded-2xl border border-sky-200 dark:border-sky-800">
                  <div className="text-xs text-sky-800 dark:text-sky-300 font-bold mb-1">Total Facturé (TTC)</div>
                  <div className="text-xl font-extrabold text-sky-700 dark:text-sky-300 font-mono">
                    {data.totalFactureTTC.toLocaleString('fr-FR')} FCFA
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {data.factures.length} factures ({data.totalFactureM3} m³)
                  </div>
                </div>

                <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                  <div className="text-xs text-emerald-800 dark:text-emerald-300 font-bold mb-1">Recettes Encaissées</div>
                  <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                    {data.totalRecettes.toLocaleString('fr-FR')} FCFA
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Taux recouv. : {data.tauxRecouvrement}%
                  </div>
                </div>

                <div className="bg-rose-50/70 dark:bg-rose-950/40 p-4 rounded-2xl border border-rose-200 dark:border-rose-800">
                  <div className="text-xs text-rose-800 dark:text-rose-300 font-bold mb-1">Dépenses Validées</div>
                  <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
                    {data.totalDepenses.toLocaleString('fr-FR')} FCFA
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {data.depenses.length} décaissements
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border ${
                  data.margeNetteExploitation >= 0
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
                }`}>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Résultat d'Exploitation</div>
                  <div className={`text-xl font-extrabold font-mono ${
                    data.margeNetteExploitation >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {data.margeNetteExploitation > 0 ? '+' : ''}
                    {data.margeNetteExploitation.toLocaleString('fr-FR')} FCFA
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Marge nette mensuelle
                  </div>
                </div>
              </div>

              {/* Canal breakdown and expense analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <span className="text-xs font-bold text-[#082F49] dark:text-white flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    Ventilation des Paiements par Canal
                  </span>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                        <span>Wave Mobile Money :</span>
                      </span>
                      <strong className="font-mono text-slate-900 dark:text-white">
                        {data.paiementsParMode.wave.toLocaleString('fr-FR')} FCFA
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                        <span>Orange Money (Sonatel) :</span>
                      </span>
                      <strong className="font-mono text-slate-900 dark:text-white">
                        {data.paiementsParMode.orangeMoney.toLocaleString('fr-FR')} FCFA
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span>Espèces en Caisse Forage :</span>
                      </span>
                      <strong className="font-mono text-slate-900 dark:text-white">
                        {data.paiementsParMode.especes.toLocaleString('fr-FR')} FCFA
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <span className="text-xs font-bold text-[#082F49] dark:text-white flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    Disponibilités en Caisse & Banque
                  </span>
                  <div className="space-y-2 text-xs">
                    {data.comptes.map((c) => (
                      <div key={c.id} className="flex items-center justify-between">
                        <span className="text-slate-600 dark:text-slate-400">{c.nom} :</span>
                        <strong className="font-mono text-slate-900 dark:text-white">
                          {c.soldeActuelFCFA.toLocaleString('fr-FR')} FCFA
                        </strong>
                      </div>
                    ))}
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex items-center justify-between font-bold text-xs">
                      <span>Total Trésorerie :</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400">
                        {data.totalSoldeTresorerie.toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FACTURES */}
          {activeTab === 'FACTURES' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#082F49] dark:text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Détail exhaustif des factures du mois ({data.factures.length})</span>
                </h3>
                <span className="text-xs font-mono text-slate-500">
                  Total : {data.totalFactureTTC.toLocaleString('fr-FR')} FCFA
                </span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">N° Facture</th>
                      <th className="py-2.5 px-3">Code</th>
                      <th className="py-2.5 px-3">Abonné</th>
                      <th className="py-2.5 px-3">Conso (m³)</th>
                      <th className="py-2.5 px-3">Total TTC</th>
                      <th className="py-2.5 px-3">Reste Dû</th>
                      <th className="py-2.5 px-3">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.factures.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {f.numeroFacture}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{f.abonneCode}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{f.abonneNom}</td>
                        <td className="py-2.5 px-3">{f.consommationM3} m³</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {f.totalTTCFCFA.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-rose-600 dark:text-rose-400">
                          {f.resteDuFCFA.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            f.statut === 'PAYEE'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : f.statut === 'EN_RETARD'
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          }`}>
                            {f.statut.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PAIEMENTS */}
          {activeTab === 'PAIEMENTS' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#082F49] dark:text-white flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-emerald-500" />
                  <span>Détail exhaustif des encaissements ({data.paiements.length})</span>
                </h3>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  Total : {data.totalRecettes.toLocaleString('fr-FR')} FCFA
                </span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Date / Heure</th>
                      <th className="py-2.5 px-3">N° Reçu</th>
                      <th className="py-2.5 px-3">Abonné</th>
                      <th className="py-2.5 px-3">N° Facture</th>
                      <th className="py-2.5 px-3">Mode</th>
                      <th className="py-2.5 px-3 text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.paiements.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-mono text-slate-500">{p.datePaiement}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold">{p.recuNumero}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{p.abonneNom}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{p.numeroFacture}</td>
                        <td className="py-2.5 px-3">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                            {p.modePaiement.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                          {p.montantFCFA.toLocaleString('fr-FR')} FCFA
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: DÉPENSES */}
          {activeTab === 'DEPENSES' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#082F49] dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-rose-500" />
                  <span>Détail exhaustif des dépenses validées ({data.depenses.length})</span>
                </h3>
                <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                  Total : {data.totalDepenses.toLocaleString('fr-FR')} FCFA
                </span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Catégorie</th>
                      <th className="py-2.5 px-3">Motif / Justificatif</th>
                      <th className="py-2.5 px-3">Compte débité</th>
                      <th className="py-2.5 px-3">Validé par</th>
                      <th className="py-2.5 px-3 text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.depenses.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-mono text-slate-500">{d.dateDepense}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">
                          {d.categorie.replace('_', ' ')}
                        </td>
                        <td className="py-2.5 px-3 text-slate-900 dark:text-white">{d.description}</td>
                        <td className="py-2.5 px-3 text-slate-500">{d.compteNom}</td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{d.valideParNom || 'Trésorier'}</td>
                        <td className="py-2.5 px-3 text-right font-extrabold font-mono text-rose-600 dark:text-rose-400">
                          {d.montantFCFA.toLocaleString('fr-FR')} FCFA
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="hidden sm:inline">Rapport certifié conforme aux normes d'audit ASUFOR / Direction de l'Hydraulique</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              Fermer
            </button>

            <button
              onClick={handleExportCsv}
              className="px-4 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Exporter l'ensemble des données du bilan au format CSV pour Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Exporter CSV</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              <span>{isExporting ? 'Génération...' : 'Télécharger le PDF Mensuel (2 Pages)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
