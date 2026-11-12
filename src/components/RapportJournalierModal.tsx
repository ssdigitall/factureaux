import React, { useState } from 'react';
import {
  X,
  FileDown,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Droplets,
  CreditCard,
  Building2,
  CheckCircle2,
  Receipt,
  Wallet,
  Clock,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { store } from '../services/store';
import { exportDailyReportPdf, generateDailyReportPdf } from '../services/pdfReportService';

interface RapportJournalierModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
}

export const RapportJournalierModal: React.FC<RapportJournalierModalProps> = ({
  isOpen,
  onClose,
  initialDate,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || new Date().toISOString().split('T')[0]
  );
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const data = store.getRapportJournalier(selectedDate);
  const todayStr = new Date().toISOString().split('T')[0];

  const handleExportPdf = () => {
    setIsExporting(true);
    try {
      exportDailyReportPdf(data);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Erreur lors de la génération du PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#082F49] via-[#0c4a75] to-[#0369A1] p-5 sm:p-6 text-white flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-cyan-400/20 text-cyan-300 flex items-center justify-center shrink-0 border border-cyan-400/30">
              <FileDown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-400/30">
                  Export PDF Officiel
                </span>
                <span className="text-xs text-sky-200/90 hidden sm:inline">
                  {data.organisationNom}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-0.5">
                Rapport d'Exploitation Journalier
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
              Journée analysée :
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            {selectedDate !== todayStr && (
              <button
                onClick={() => setSelectedDate(todayStr)}
                className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer ml-1"
              >
                Aujourd'hui
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Imprimer le document"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimer</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              <span>{isExporting ? 'Génération...' : 'Télécharger le PDF'}</span>
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {exportSuccess && (
          <div className="bg-emerald-500 text-white px-4 py-2 text-xs font-bold flex items-center justify-between no-print animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>
                Le fichier <strong>Rapport_Journalier_FACTUREAU_{selectedDate}.pdf</strong> a été téléchargé avec succès !
              </span>
            </div>
            <button onClick={() => setExportSuccess(false)} className="text-white hover:text-emerald-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Modal Scrollable Body - Document Preview */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-800 dark:text-slate-200">
          {/* Subheader info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                {data.organisationNom}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Rapport journalier officiel d'exploitation - {data.formattedDateFr}
              </p>
            </div>
            <div className="text-left sm:text-right text-[11px]">
              <div>Émis par : <strong>{data.agentNom}</strong> ({data.agentRole})</div>
              <div className="text-slate-400">Périmètre : {data.forages.length} forages & réseaux ruraux</div>
            </div>
          </div>

          {/* 4 Summary KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* KPI 1: Recettes */}
            <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-bold mb-1">
                <span>Recettes du jour</span>
                <TrendingDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                {data.totalRevenusFCFA.toLocaleString('fr-FR')} FCFA
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {data.paiements.length} encaissements
              </div>
            </div>

            {/* KPI 2: Dépenses */}
            <div className="bg-rose-50/70 dark:bg-rose-950/40 p-4 rounded-2xl border border-rose-200 dark:border-rose-800">
              <div className="flex items-center justify-between text-xs text-rose-800 dark:text-rose-300 font-bold mb-1">
                <span>Dépenses validées</span>
                <TrendingUp className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
                {data.totalDepensesFCFA.toLocaleString('fr-FR')} FCFA
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {data.depenses.length} décaissements
              </div>
            </div>

            {/* KPI 3: Solde net */}
            <div className={`p-4 rounded-2xl border ${
              data.soldeNetJournalierFCFA >= 0
                ? 'bg-sky-50/70 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800'
                : 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
            }`}>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                <span>Solde net du jour</span>
                <Wallet className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div className={`text-xl font-extrabold font-mono ${
                data.soldeNetJournalierFCFA >= 0
                  ? 'text-cyan-700 dark:text-cyan-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}>
                {data.soldeNetJournalierFCFA > 0 ? '+' : ''}
                {data.soldeNetJournalierFCFA.toLocaleString('fr-FR')} FCFA
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Flux net de trésorerie
              </div>
            </div>

            {/* KPI 4: Production */}
            <div className="bg-cyan-50/70 dark:bg-cyan-950/40 p-4 rounded-2xl border border-cyan-200 dark:border-cyan-800">
              <div className="flex items-center justify-between text-xs text-cyan-800 dark:text-cyan-300 font-bold mb-1">
                <span>Volume pompé</span>
                <Droplets className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div className="text-xl font-extrabold text-cyan-700 dark:text-cyan-300 font-mono">
                {data.totalVolumeProduitM3.toLocaleString('fr-FR')} m³
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {data.production.length} forages relevés
              </div>
            </div>
          </div>

          {/* Section 1: Tableau des Encaissements */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
              <h3 className="text-sm font-extrabold text-[#082F49] dark:text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-500" />
                <span>1. Encaissements & Recettes Journalières</span>
              </h3>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" />
                  Wave: <strong>{data.paiementsParMode.wave.toLocaleString('fr-FR')} F</strong>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  OM: <strong>{data.paiementsParMode.orangeMoney.toLocaleString('fr-FR')} F</strong>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Espèces: <strong>{data.paiementsParMode.especes.toLocaleString('fr-FR')} F</strong>
                </span>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Heure</th>
                    <th className="py-2.5 px-3">N° Reçu</th>
                    <th className="py-2.5 px-3">Abonné</th>
                    <th className="py-2.5 px-3">N° Facture</th>
                    <th className="py-2.5 px-3">Mode</th>
                    <th className="py-2.5 px-3 text-right">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.paiements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-400 italic">
                        Aucun encaissement enregistré pour la date du {selectedDate}.
                      </td>
                    </tr>
                  ) : (
                    data.paiements.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                          {p.datePaiement.includes(' ') ? p.datePaiement.split(' ')[1] : '--:--'}
                        </td>
                        <td className="py-2 px-3 font-mono font-semibold text-slate-700 dark:text-slate-300">
                          {p.recuNumero}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
                          {p.abonneNom}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-500 text-[11px]">
                          {p.numeroFacture}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            p.modePaiement === 'WAVE'
                              ? 'bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800'
                              : p.modePaiement === 'ORANGE_MONEY'
                              ? 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-800'
                              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          }`}>
                            {p.modePaiement.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                          {p.montantFCFA.toLocaleString('fr-FR')} FCFA
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Tableau des Dépenses */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-[#082F49] dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-rose-500" />
              <span>2. Décaissements & Dépenses Validées</span>
            </h3>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Catégorie</th>
                    <th className="py-2.5 px-3">Description / Motif</th>
                    <th className="py-2.5 px-3">Compte débité</th>
                    <th className="py-2.5 px-3">Validé par</th>
                    <th className="py-2.5 px-3 text-right">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.depenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-400 italic">
                        Aucune dépense validée pour la date du {selectedDate}.
                      </td>
                    </tr>
                  ) : (
                    data.depenses.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">
                          {d.categorie.replace('_', ' ')}
                        </td>
                        <td className="py-2 px-3 text-slate-800 dark:text-slate-200">
                          {d.description}
                        </td>
                        <td className="py-2 px-3 text-slate-500 dark:text-slate-400 text-[11px]">
                          {d.compteNom}
                        </td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-300 text-[11px]">
                          {d.valideParNom || 'Trésorier'}
                        </td>
                        <td className="py-2 px-3 text-right font-extrabold font-mono text-rose-600 dark:text-rose-400">
                          {d.montantFCFA.toLocaleString('fr-FR')} FCFA
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Tableau de Production d'Eau */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-[#082F49] dark:text-white flex items-center gap-2">
              <Droplets className="w-4 h-4 text-cyan-500" />
              <span>3. Production d'Eau & Relevés des Forages</span>
            </h3>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Forage / Site</th>
                    <th className="py-2.5 px-3">Ancien Index (m³)</th>
                    <th className="py-2.5 px-3">Nouvel Index (m³)</th>
                    <th className="py-2.5 px-3 font-bold text-cyan-700 dark:text-cyan-300">Volume Pompé</th>
                    <th className="py-2.5 px-3">Agent Releveur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.production.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-400 italic">
                        Aucun relevé de compteur de production saisi ce jour.
                      </td>
                    </tr>
                  ) : (
                    data.production.map((prod) => (
                      <tr key={prod.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                          {prod.forageNom}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400">
                          {prod.ancienIndexM3.toLocaleString('fr-FR')} m³
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400">
                          {prod.nouvelIndexM3.toLocaleString('fr-FR')} m³
                        </td>
                        <td className="py-2 px-3 font-extrabold font-mono text-cyan-600 dark:text-cyan-400">
                          +{prod.volumeProduitM3.toLocaleString('fr-FR')} m³
                        </td>
                        <td className="py-2 px-3 text-slate-500 text-[11px]">
                          {prod.agentNom}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Soldes de Trésorerie & Signatures */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-bold text-[#082F49] dark:text-white flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                Solde de Clôture des Comptes Caisse
              </span>
              <div className="space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800/60">
                {data.comptes.map((c) => (
                  <div key={c.id} className="flex items-center justify-between pt-1.5">
                    <span className="text-slate-600 dark:text-slate-400">{c.nom}</span>
                    <strong className="font-mono text-slate-900 dark:text-white">
                      {c.soldeActuelFCFA.toLocaleString('fr-FR')} FCFA
                    </strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs flex flex-col justify-between">
              <span className="font-bold text-[#082F49] dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Certification & Conformité
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Document d'exploitation journalier généré par la plateforme SaaS FACTUREAU V3.0.
                Valeur probante pour la reddition de comptes du comité de gestion de l'eau.
              </p>
              <div className="grid grid-cols-2 gap-2 mt-3 text-[10px] text-center text-slate-400">
                <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-2">
                  <span>Visa Trésorier</span>
                </div>
                <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-2">
                  <span>Approbation Présidence</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer with Actions */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 no-print">
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
            Fichier exporté au format vectoriel A4 haute définition
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              Fermer
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              <span>{isExporting ? 'Génération en cours...' : 'Télécharger le PDF du jour'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
