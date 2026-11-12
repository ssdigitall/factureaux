import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  UserCheck,
  UserX,
  Phone,
  MapPin,
  Receipt,
  FileSpreadsheet,
  AlertCircle,
  Eye,
  CheckCircle2,
  QrCode,
  Camera,
  Trash2,
  Activity,
  TrendingUp,
  FileDown,
  FileText,
} from 'lucide-react';
import { store } from '../services/store';
import { Abonne, CategorieAbonne, StatutAbonne } from '../types';
import { CarteAbonneModal } from './CarteAbonneModal';
import { CompteurPhotoScannerModal } from './CompteurPhotoScannerModal';
import { AbonneConsoMiniSparkline, AbonneConsoHistoryModal } from './AbonneConsoSparkline';
import { AbonnesExportModal } from './AbonnesExportModal';
import { exportAbonnesPdf, exportAbonnesCsv } from '../services/subscriberExportService';
import { formatFCFA } from '../utils/formatters';
import { downloadInvoicePdf } from '../services/invoicePdfService';
import { QRCameraScannerModal, ScannedResult } from './QRCameraScannerModal';

export const AbonnesView: React.FC = () => {
  const [abonnes, setAbonnes] = useState<Abonne[]>(store.getAbonnes());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedForage, setSelectedForage] = useState('ALL');
  const [selectedStatut, setSelectedStatut] = useState('ALL');
  const [selectedCategorie, setSelectedCategorie] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingAbonne, setViewingAbonne] = useState<Abonne | null>(null);
  const [selectedCardAbonne, setSelectedCardAbonne] = useState<Abonne | null>(null);
  const [showScannerModal, setShowScannerModal] = useState<boolean>(false);
  const [scannerAbonneId, setScannerAbonneId] = useState<string | undefined>(undefined);
  const [selectedConsoHistoryAbonne, setSelectedConsoHistoryAbonne] = useState<Abonne | null>(null);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showQRCameraModal, setShowQRCameraModal] = useState<boolean>(false);
  const [feedbackToast, setFeedbackToast] = useState<{ text: string; type: 'success' | 'alert' | 'info' } | null>(null);

  const handleScanQRSuccess = (result: ScannedResult) => {
    setShowQRCameraModal(false);
    if (result.abonne) {
      setViewingAbonne(result.abonne);
      setSearchTerm(result.abonne.codeAbonne);
      setFeedbackToast({
        text: `Compteur & abonné identifiés par QR Code : ${result.abonne.prenom} ${result.abonne.nom} (${result.abonne.codeAbonne}).`,
        type: 'success',
      });
      setTimeout(() => setFeedbackToast(null), 5000);
    } else if (result.facture) {
      const abn = abonnes.find((a) => a.id === result.facture?.abonneId);
      if (abn) {
        setViewingAbonne(abn);
        setSearchTerm(abn.codeAbonne);
        setFeedbackToast({
          text: `Facture N° ${result.facture.numeroFacture} reconnue : Abonné ${abn.prenom} ${abn.nom} (${abn.codeAbonne}).`,
          type: 'success',
        });
        setTimeout(() => setFeedbackToast(null), 5000);
      }
    } else if (result.rawText) {
      const found = abonnes.find(
        (a) =>
          a.codeAbonne.toLowerCase() === result.rawText.toLowerCase() ||
          a.telephone.replace(/\s/g, '').includes(result.rawText.replace(/\s/g, ''))
      );
      if (found) {
        setViewingAbonne(found);
        setSearchTerm(found.codeAbonne);
        setFeedbackToast({
          text: `Abonné identifié par scan : ${found.prenom} ${found.nom} (${found.codeAbonne}).`,
          type: 'success',
        });
      } else {
        setSearchTerm(result.rawText);
        setFeedbackToast({
          text: `Code QR scanné : ${result.rawText}`,
          type: 'info',
        });
      }
      setTimeout(() => setFeedbackToast(null), 5000);
    }
  };

  const forages = store.getForages();
  const compteurs = store.getCompteurs();
  const currentUser = store.getCurrentUser();

  React.useEffect(() => {
    return store.subscribe(() => {
      setAbonnes(store.getAbonnes());
    });
  }, []);

  // Form state
  const [codeAbonne, setCodeAbonne] = useState(`ABN-${String(abonnes.length + 1).padStart(3, '0')}`);
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('+221 ');
  const [quartier, setQuartier] = useState('Quartier Escale');
  const [adresse, setAdresse] = useState('');
  const [forageId, setForageId] = useState(forages[0]?.id || '');
  const [categorie, setCategorie] = useState<CategorieAbonne>('DOMESTIQUE');

  const filteredAbonnes = abonnes.filter((a) => {
    const cleanSearch = searchTerm.trim().toLowerCase().replace(/12\s*\/\s*500/g, '12.500');
    const matchesSearch =
      a.nom.toLowerCase().includes(cleanSearch) ||
      a.prenom.toLowerCase().includes(cleanSearch) ||
      a.codeAbonne.toLowerCase().includes(cleanSearch) ||
      a.telephone.includes(cleanSearch) ||
      a.quartier.toLowerCase().includes(cleanSearch) ||
      formatFCFA(a.soldeDetteFCFA).toLowerCase().includes(cleanSearch);

    const matchesForage = selectedForage === 'ALL' || a.forageId === selectedForage;
    const matchesStatut = selectedStatut === 'ALL' || a.statut === selectedStatut;
    const matchesCat = selectedCategorie === 'ALL' || a.categorie === selectedCategorie;

    return matchesSearch && matchesForage && matchesStatut && matchesCat;
  });

  const handleAddAbonne = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prenom || !nom || !telephone) {
      setFeedbackToast({
        text: 'Veuillez renseigner le nom, prénom et numéro de téléphone.',
        type: 'alert',
      });
      setTimeout(() => setFeedbackToast(null), 4000);
      return;
    }

    store.addAbonne({
      codeAbonne,
      prenom,
      nom,
      telephone,
      quartier,
      adresse,
      forageId: forageId || forages[0]?.id,
      categorie,
      statut: 'ACTIF',
    });

    setShowAddModal(false);
    setPrenom('');
    setNom('');
    setTelephone('+221 ');
    setAdresse('');
    setCodeAbonne(`ABN-${String(abonnes.length + 2).padStart(3, '0')}`);
    setFeedbackToast({
      text: `Abonné ${prenom} ${nom} ajouté avec succès.`,
      type: 'success',
    });
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  const getSelectedForageNom = () => {
    if (selectedForage === 'ALL') return 'Tous les forages du réseau';
    const found = forages.find((f) => f.id === selectedForage);
    return found ? `${found.nom} (${found.code})` : 'Forage principal';
  };

  const handleExportCSV = () => {
    exportAbonnesCsv(filteredAbonnes, {
      selectedForageNom: getSelectedForageNom(),
      destinataire: 'Gestion & Analyse Tableur Excel',
    });
  };

  const handleQuickExportPdf = () => {
    exportAbonnesPdf(filteredAbonnes, {
      selectedForageNom: getSelectedForageNom(),
      destinataire: 'Autorités Administratives & Partenaires',
      dateGeneration: new Date().toLocaleDateString('fr-FR'),
    });
  };

  const handleImportCSVSimulation = () => {
    const count = Math.floor(Math.random() * 5) + 2;
    for (let i = 0; i < count; i++) {
      const randomNum = Math.floor(Math.random() * 900) + 100;
      store.addAbonne({
        codeAbonne: `ABN-CSV-${randomNum}`,
        prenom: ['Moussa', 'Awa', 'Babacar', 'Aminata', 'Ousmane'][i % 5],
        nom: ['Diouf', 'Fall', 'Sow', 'Ba', 'Ndiaye'][i % 5],
        telephone: `+221 77 ${Math.floor(Math.random() * 899 + 100)} 00 ${i}`,
        quartier: 'Nouveau Lotissement',
        adresse: `Lot N°${randomNum}`,
        forageId: forages[0]?.id,
        categorie: 'DOMESTIQUE',
        statut: 'ACTIF',
      });
    }
    setFeedbackToast({
      text: `Importation réussie : ${count} nouveaux abonnés importés avec succès.`,
      type: 'success',
    });
    setTimeout(() => setFeedbackToast(null), 5000);
  };

  const handleToggleStatut = (abonne: Abonne) => {
    const next: StatutAbonne =
      abonne.statut === 'ACTIF' ? 'SUSPENDU' : abonne.statut === 'SUSPENDU' ? 'CLOTURE' : 'ACTIF';
    store.updateAbonne(abonne.id, { statut: next });
  };

  const canEdit = ['ADMIN_ORG', 'ADMIN_FORAGE', 'TRESORIER'].includes(currentUser.role);
  const canDelete = ['ADMIN_ORG', 'SUPER_ADMIN'].includes(currentUser.role);

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all shadow-md ${
            feedbackToast.type === 'alert'
              ? 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-800'
              : feedbackToast.type === 'info'
              ? 'bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950/80 dark:text-sky-200 dark:border-sky-800'
              : 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackToast.type === 'alert' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            )}
            <span>{feedbackToast.text}</span>
          </div>
          <button
            onClick={() => setFeedbackToast(null)}
            className="hover:opacity-75 p-1 rounded-lg cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Title & Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#082F49] dark:text-cyan-300 flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            Gestion des Abonnés & Branchements
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {filteredAbonnes.length} abonnés répertoriés — Suivi des compteurs, états financiers et exports certifiés.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export Group */}
          <div className="inline-flex items-center p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs">
            <button
              onClick={handleQuickExportPdf}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-sky-800 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              title="Télécharger la liste affichée en PDF officiel A4 paysage"
            >
              <FileDown className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Exporter PDF</span>
            </button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 my-auto" />
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              title="Exporter la liste au format CSV Excel (UTF-8 avec séparateurs)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Exporter CSV</span>
            </button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 my-auto" />
            <button
              onClick={() => setShowExportModal(true)}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-[#082F49] dark:bg-sky-700 text-white hover:bg-sky-900 transition flex items-center gap-1 cursor-pointer"
              title="Options d'exportation avancées (visas OFOR, DGPRE, Mairie, Bailleurs)"
            >
              <FileText className="w-3 h-3 text-cyan-300" />
              <span>Options & Visas</span>
            </button>
          </div>

          {canEdit && (
            <>
              <button
                onClick={handleImportCSVSimulation}
                className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Importer un fichier d'abonnés"
              >
                <Upload className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Importer CSV</span>
              </button>

              <button
                onClick={() => setShowQRCameraModal(true)}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Scanner le QR code d'un compteur, badge ou facture avec la caméra"
              >
                <QrCode className="w-4 h-4 text-emerald-200" />
                <span>Scanner QR Code</span>
              </button>

              <button
                onClick={() => {
                  setScannerAbonneId(undefined);
                  setShowScannerModal(true);
                }}
                className="bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Scanner ou photographier les chiffres d'un compteur avec la caméra"
              >
                <Camera className="w-4 h-4 text-cyan-200" />
                <span>Photo Index</span>
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter un abonné</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom, prénom, code ABN-001, téléphone, quartier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedForage}
            onChange={(e) => setSelectedForage(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="ALL">Tous les forages</option>
            {forages.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nom}
              </option>
            ))}
          </select>

          <select
            value={selectedStatut}
            onChange={(e) => setSelectedStatut(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="ALL">Tous statuts</option>
            <option value="ACTIF">Actif</option>
            <option value="SUSPENDU">Suspendu</option>
            <option value="CLOTURE">Clôturé</option>
          </select>

          <select
            value={selectedCategorie}
            onChange={(e) => setSelectedCategorie(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="ALL">Toutes catégories</option>
            <option value="DOMESTIQUE">Domestique</option>
            <option value="COMMERCIAL">Commercial</option>
            <option value="MARAICHER">Maraîcher</option>
            <option value="SOCIAL">Social</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Abonné</th>
                <th className="py-3 px-4">Téléphone</th>
                <th className="py-3 px-4">Quartier</th>
                <th className="py-3 px-4">Compteur</th>
                <th className="py-3 px-4">Catégorie</th>
                <th className="py-3 px-4">Conso 6 Mois (Tendance)</th>
                <th className="py-3 px-4">Solde Dû</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredAbonnes.map((abonne) => {
                const cpt = compteurs.find((c) => c.id === abonne.compteurId);
                const aDette = abonne.soldeDetteFCFA > 0;

                return (
                  <tr key={abonne.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-800 dark:text-cyan-400">
                      {abonne.codeAbonne}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {abonne.prenom} {abonne.nom}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono">
                      {abonne.telephone}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      {abonne.quartier}
                    </td>
                    <td className="py-3.5 px-4">
                      {cpt ? (
                        <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                          {cpt.numeroSerie}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Non assigné</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                        {abonne.categorie}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <AbonneConsoMiniSparkline
                        abonne={abonne}
                        onClick={() => setSelectedConsoHistoryAbonne(abonne)}
                      />
                    </td>
                    <td className="py-3.5 px-4 font-bold">
                      <span className={aDette ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                        {formatFCFA(abonne.soldeDetteFCFA)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          abonne.statut === 'ACTIF'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            : abonne.statut === 'SUSPENDU'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        {abonne.statut}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedConsoHistoryAbonne(abonne)}
                          className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 transition cursor-pointer"
                          title="Historique chronologique et graphique sparkline des 6 derniers mois"
                        >
                          <Activity className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setScannerAbonneId(abonne.id);
                            setShowScannerModal(true);
                          }}
                          className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-cyan-300 transition cursor-pointer"
                          title="Scanner / Photographier le compteur de cet abonné"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedCardAbonne(abonne)}
                          className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 transition cursor-pointer"
                          title="Afficher et imprimer la carte d'abonné (Badge QR)"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setViewingAbonne(abonne)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                          title="Voir le dossier complet"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => handleToggleStatut(abonne)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                            title="Changer statut (Actif / Suspendu / Clôturé)"
                          >
                            {abonne.statut === 'ACTIF' ? (
                              <UserX className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            )}
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => {
                              const motif = window.prompt(
                                `Confirmer la suppression définitive de l'abonné ${abonne.prenom} ${abonne.nom} (${abonne.codeAbonne}) ?\nIndiquez le motif obligatoire pour le journal d'audit :`
                              );
                              if (motif !== null) {
                                store.deleteAbonne(abonne.id, motif);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition cursor-pointer"
                            title="Supprimer l'abonné (Action critique enregistrée dans les logs d'audit)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Abonne Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-[#082F49] dark:text-cyan-300 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              Ajouter un Nouvel Abonné
            </h3>

            <form onSubmit={handleAddAbonne} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Code Abonné *</label>
                  <input
                    type="text"
                    required
                    value={codeAbonne}
                    onChange={(e) => setCodeAbonne(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Ibrahima"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Ndiaye"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Téléphone mobile *</label>
                  <input
                    type="text"
                    required
                    placeholder="+221 77 000 00 00"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Forage de rattachement</label>
                  <select
                    value={forageId}
                    onChange={(e) => setForageId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {forages.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Quartier / Secteur</label>
                  <input
                    type="text"
                    value={quartier}
                    onChange={(e) => setQuartier(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Catégorie tarifaire</label>
                  <select
                    value={categorie}
                    onChange={(e) => setCategorie(e.target.value as CategorieAbonne)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="DOMESTIQUE">Domestique</option>
                    <option value="COMMERCIAL">Commercial (Boutique, atelier)</option>
                    <option value="MARAICHER">Maraîcher / Agricole</option>
                    <option value="SOCIAL">Social</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Adresse ou repère géographique</label>
                <input
                  type="text"
                  placeholder="Ex: Face Grande Mosquée, Villa 15"
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer"
                >
                  Enregistrer l'abonné
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Dossier Modal */}
      {viewingAbonne && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-start justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300">
                  {viewingAbonne.codeAbonne}
                </span>
                <h3 className="text-lg font-bold text-[#082F49] dark:text-cyan-300 mt-1">
                  {viewingAbonne.prenom} {viewingAbonne.nom}
                </h3>
                <div className="text-xs text-slate-500 dark:text-slate-400">{viewingAbonne.quartier}</div>
              </div>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                  viewingAbonne.statut === 'ACTIF'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                }`}
              >
                {viewingAbonne.statut}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Téléphone</span>
                  <strong className="text-slate-800 dark:text-slate-200">{viewingAbonne.telephone}</strong>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Catégorie</span>
                  <strong className="text-slate-800 dark:text-slate-200">{viewingAbonne.categorie}</strong>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Adresse</span>
                  <span className="text-slate-700 dark:text-slate-300">{viewingAbonne.adresse || 'Non précisée'}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Dette actuelle</span>
                  <strong className={viewingAbonne.soldeDetteFCFA > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                    {formatFCFA(viewingAbonne.soldeDetteFCFA)}
                  </strong>
                </div>
              </div>

              {/* 6-Month Water Consumption Sparkline Callout */}
              <div className="p-3 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-cyan-900 dark:text-cyan-300 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>Consommation d'Eau (6 Derniers Mois)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedConsoHistoryAbonne(viewingAbonne)}
                    className="text-[10px] font-bold text-cyan-700 dark:text-cyan-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Détails & Graphique</span>
                    <TrendingUp className="w-3 h-3" />
                  </button>
                </div>
                <AbonneConsoMiniSparkline
                  abonne={viewingAbonne}
                  onClick={() => setSelectedConsoHistoryAbonne(viewingAbonne)}
                />
              </div>

              {/* Invoices for this subscriber */}
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Factures de l'abonné</h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {store
                    .getFactures()
                    .filter((f) => f.abonneId === viewingAbonne.id)
                    .map((fac) => (
                      <div
                        key={fac.id}
                        className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{fac.numeroFacture}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500">
                            {fac.periode} • {fac.consommationM3} m³
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {formatFCFA(fac.totalTTCFCFA)}
                            </div>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                fac.statut === 'PAYEE'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                              }`}
                            >
                              {fac.statut}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => downloadInvoicePdf(fac)}
                            className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 transition cursor-pointer"
                            title="Télécharger la facture imprimable (PDF)"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setViewingAbonne(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 dark:bg-slate-700 text-white font-semibold text-xs hover:bg-slate-700 dark:hover:bg-slate-600 cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Carte d'Abonné (Badge QR) Modal */}
      <CarteAbonneModal
        abonne={selectedCardAbonne}
        onClose={() => setSelectedCardAbonne(null)}
      />

      {/* Scanner / Photo Compteur Modal */}
      <CompteurPhotoScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        preselectedAbonneId={scannerAbonneId}
      />

      {/* 6-Month Chronological Consumption Modal with Sparkline */}
      <AbonneConsoHistoryModal
        abonne={selectedConsoHistoryAbonne}
        isOpen={!!selectedConsoHistoryAbonne}
        onClose={() => setSelectedConsoHistoryAbonne(null)}
      />

      {/* Export Registre Abonnés (PDF & CSV) Modal */}
      <AbonnesExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        filteredAbonnes={filteredAbonnes}
        allAbonnes={abonnes}
        selectedForageName={getSelectedForageNom()}
      />

      {/* Caméra QR Code Scanner pour Identification Rapide Compteur/Abonné */}
      <QRCameraScannerModal
        isOpen={showQRCameraModal}
        onClose={() => setShowQRCameraModal(false)}
        onScanSuccess={handleScanQRSuccess}
      />
    </div>
  );
};
