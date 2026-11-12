import React, { useState } from 'react';
import {
  X,
  FileDown,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Building2,
  Users,
  ShieldCheck,
  Landmark,
  Check,
  Printer,
  Sparkles,
} from 'lucide-react';
import { Abonne } from '../types';
import { store } from '../services/store';
import { exportAbonnesPdf, exportAbonnesCsv } from '../services/subscriberExportService';
import { formatNumberDot } from '../utils/formatters';

interface AbonnesExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  filteredAbonnes: Abonne[];
  allAbonnes: Abonne[];
  selectedForageName?: string;
}

export const AbonnesExportModal: React.FC<AbonnesExportModalProps> = ({
  isOpen,
  onClose,
  filteredAbonnes,
  allAbonnes,
  selectedForageName = 'Tous les forages',
}) => {
  const [exportScope, setExportScope] = useState<'FILTERED' | 'ALL'>('FILTERED');
  const [destinataire, setDestinataire] = useState<string>(
    'Office des Forages Ruraux (OFOR) & Tutelle Administrative'
  );
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentOrg = store.getCurrentOrganisation();
  const forages = store.getForages();
  const compteurs = store.getCompteurs();

  const selectedList = exportScope === 'FILTERED' ? filteredAbonnes : allAbonnes;
  const totalCount = selectedList.length;
  const actifsCount = selectedList.filter((a) => a.statut === 'ACTIF').length;
  const totalDette = selectedList.reduce((sum, a) => sum + (a.soldeDetteFCFA || 0), 0);
  const withMeterCount = selectedList.filter((a) => a.compteurId).length;

  const destinations = [
    {
      id: 'OFOR',
      label: 'Office des Forages Ruraux (OFOR) & Tutelle Administrative',
      desc: 'Contrôle réglementaire, suivi de délégation de service public et audit de gestion.',
      icon: Landmark,
    },
    {
      id: 'DGPRE',
      label: 'DGPRE (Direction de la Gestion et Planification des Ressources en Eau)',
      desc: 'Suivi des prélèvements de nappe, de la pression et de la planification hydraulique.',
      icon: Building2,
    },
    {
      id: 'MAIRIE',
      label: 'Mairie & Conseil Municipal (Collectivité Territoriale)',
      desc: 'Rapport communal sur la couverture en eau potable et l\'équité des branchements sociaux.',
      icon: Users,
    },
    {
      id: 'BAILLEURS',
      label: 'Partenaires Techniques & Bailleurs (Banque Mondiale, AFD, JICA)',
      desc: 'Indicateurs de performance, taux d\'accès au réseau et pérennité financière.',
      icon: Sparkles,
    },
    {
      id: 'INTERNE',
      label: 'Comité Directeur ASUFOR (Usage Interne de Gestion)',
      desc: 'Recouvrement des créances, relances d\'impayés et révision de la base usagers.',
      icon: ShieldCheck,
    },
  ];

  const handleDownloadPdf = () => {
    setIsExportingPdf(true);
    try {
      exportAbonnesPdf(selectedList, {
        organisation: currentOrg,
        forages,
        compteurs,
        selectedForageNom: selectedForageName,
        destinataire,
        dateGeneration: new Date().toLocaleDateString('fr-FR'),
      });
      setSuccessMessage('Le registre officiel en PDF a été généré et téléchargé avec succès !');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Erreur export PDF abonnés:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadCsv = () => {
    setIsExportingCsv(true);
    try {
      exportAbonnesCsv(selectedList, {
        organisation: currentOrg,
        forages,
        compteurs,
        selectedForageNom: selectedForageName,
        destinataire,
      });
      setSuccessMessage('Le fichier CSV (Tableur Excel) a été exporté avec succès !');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Erreur export CSV abonnés:', err);
    } finally {
      setIsExportingCsv(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#082F49] via-[#0c4a75] to-[#0369A1] text-white flex items-center justify-between border-b border-sky-900/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 flex items-center justify-center font-bold">
              <FileDown className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  Exportation du Registre des Abonnés
                </h3>
                <span className="text-[10px] bg-cyan-500/30 text-cyan-200 px-2 py-0.5 rounded-full font-mono font-bold">
                  PDF & CSV
                </span>
              </div>
              <p className="text-xs text-cyan-100/90 mt-0.5">
                {currentOrg?.nom || 'ASUFOR de Touba Toul'} • Conforme aux exigences OFOR & Bailleurs
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

        {/* Success toast */}
        {successMessage && (
          <div className="mx-6 mt-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 text-xs font-semibold rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 dark:text-slate-300 flex-1">
          {/* Scope Selector */}
          <div>
            <label className="block text-slate-800 dark:text-slate-200 font-bold mb-2">
              1. Sélectionner le périmètre des abonnés à exporter
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExportScope('FILTERED')}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3 ${
                  exportScope === 'FILTERED'
                    ? 'border-cyan-500 bg-cyan-50/60 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-200 ring-2 ring-cyan-500/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                    exportScope === 'FILTERED'
                      ? 'border-cyan-600 bg-cyan-600 text-white'
                      : 'border-slate-400 bg-white dark:bg-slate-800'
                  }`}
                >
                  {exportScope === 'FILTERED' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    Vue Filtrée Actuelle ({filteredAbonnes.length} abonnés)
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Exporte uniquement les abonnés correspondant à vos filtres et recherche en cours.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setExportScope('ALL')}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3 ${
                  exportScope === 'ALL'
                    ? 'border-cyan-500 bg-cyan-50/60 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-200 ring-2 ring-cyan-500/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                    exportScope === 'ALL'
                      ? 'border-cyan-600 bg-cyan-600 text-white'
                      : 'border-slate-400 bg-white dark:bg-slate-800'
                  }`}
                >
                  {exportScope === 'ALL' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    Registre Complet ({allAbonnes.length} abonnés)
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Exporte la totalité des abonnés répertoriés sur tous les quartiers et forages.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Aggregates strip */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div>
              <div className="text-slate-400 text-[10px] font-semibold">Usagers inclus</div>
              <div className="text-base font-black text-[#082F49] dark:text-sky-300 font-mono mt-0.5">
                {totalCount}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px] font-semibold">Abonnés Actifs</div>
              <div className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                {actifsCount}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px] font-semibold">Avec Compteur</div>
              <div className="text-base font-black text-cyan-600 dark:text-cyan-400 font-mono mt-0.5">
                {withMeterCount}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px] font-semibold">Dette Cumulée</div>
              <div className="text-base font-black text-rose-600 dark:text-rose-400 font-mono mt-0.5">
                {formatNumberDot(totalDette)} F
              </div>
            </div>
          </div>

          {/* Destination Selector */}
          <div>
            <label className="block text-slate-800 dark:text-slate-200 font-bold mb-2">
              2. Indiquer le destinataire / cadre officiel de transmission
            </label>
            <div className="space-y-2">
              {destinations.map((dest) => {
                const IconComponent = dest.icon;
                const isSelected = destinataire === dest.label;

                return (
                  <div
                    key={dest.id}
                    onClick={() => setDestinataire(dest.label)}
                    className={`p-3 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'border-cyan-500 bg-sky-50/50 dark:bg-sky-950/30 ring-1 ring-cyan-500/40'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {dest.label}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {dest.desc}
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950/60 px-2 py-0.5 rounded-full shrink-0">
                        Sélectionné
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer transition"
          >
            Fermer
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleDownloadCsv}
              disabled={isExportingCsv}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              title="Exporter sous format CSV avec encodage UTF-8 Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{isExportingCsv ? 'Export CSV...' : 'Exporter CSV (Tableur)'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="flex-1 sm:flex-initial px-4.5 py-2 rounded-xl bg-gradient-to-r from-[#082F49] to-cyan-700 hover:from-[#0c4a75] hover:to-cyan-600 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
              title="Générer le PDF officiel format A4 paysage avec en-têtes institutionnels et visas"
            >
              <FileText className="w-4 h-4 text-cyan-300" />
              <span>{isExportingPdf ? 'Génération PDF...' : 'Télécharger PDF Officiel (A4)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
