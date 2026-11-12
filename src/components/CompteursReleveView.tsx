import React, { useState } from 'react';
import {
  Gauge,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  ArrowRight,
  FileCheck,
  Search,
  RefreshCw,
  Sparkles,
  Camera,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { store } from '../services/store';
import { toast } from '../services/toastService';
import { Compteur, Releve, Abonne } from '../types';
import { CompteurPhotoScannerModal } from './CompteurPhotoScannerModal';

interface CompteursReleveViewProps {
  initialAbonneId?: string;
  initialNouvelIndex?: number;
  initialOpenAddReleve?: boolean;
}

export const CompteursReleveView: React.FC<CompteursReleveViewProps> = ({
  initialAbonneId,
  initialNouvelIndex,
  initialOpenAddReleve,
}) => {
  const [activeTab, setActiveTab] = useState<'releves' | 'compteurs'>('releves');
  const [releves, setReleves] = useState<Releve[]>(store.getReleves());
  const [compteurs, setCompteurs] = useState<Compteur[]>(store.getCompteurs());
  const [abonnes, setAbonnes] = useState<Abonne[]>(store.getAbonnes());
  const [showAddReleveModal, setShowAddReleveModal] = useState(false);
  const [showAddCompteurModal, setShowAddCompteurModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannerAbonneId, setScannerAbonneId] = useState<string | undefined>(undefined);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  const currentUser = store.getCurrentUser();
  const forages = store.getForages();

  React.useEffect(() => {
    return store.subscribe(() => {
      setReleves(store.getReleves());
      setCompteurs(store.getCompteurs());
      setAbonnes(store.getAbonnes());
    });
  }, []);

  // Handle voice-dictated initial values
  React.useEffect(() => {
    if (initialOpenAddReleve) {
      if (initialAbonneId) {
        setSelectedAbonneId(initialAbonneId);
      }
      if (initialNouvelIndex !== undefined && initialNouvelIndex > 0) {
        setNouvelIndex(initialNouvelIndex);
      }
      setShowAddReleveModal(true);
    }
  }, [initialOpenAddReleve, initialAbonneId, initialNouvelIndex]);

  // Form Relevé
  const [selectedAbonneId, setSelectedAbonneId] = useState(abonnes[0]?.id || '');
  const [nouvelIndex, setNouvelIndex] = useState<number>(0);
  const [motifCorrection, setMotifCorrection] = useState('');
  const [releveError, setReleveError] = useState<string | null>(null);
  const [autoGenFacture, setAutoGenFacture] = useState(true);

  // Form Compteur
  const [numSerie, setNumSerie] = useState('');
  const [marque, setMarque] = useState('Diehl Metering');
  const [diametre, setDiametre] = useState(15);
  const [initialIndex, setInitialIndex] = useState(0);
  const [assignAbonneId, setAssignAbonneId] = useState('');

  const selectedAbonne = abonnes.find((a) => a.id === selectedAbonneId);
  const selectedCompteur = compteurs.find((c) => c.id === selectedAbonne?.compteurId);
  const ancienIndex = selectedCompteur ? selectedCompteur.dernierIndex : 0;
  const consommationCalculee = nouvelIndex > ancienIndex ? nouvelIndex - ancienIndex : 0;

  const handleOpenNewReleve = (abn?: Abonne) => {
    const target = abn || abonnes[0];
    if (target) {
      setSelectedAbonneId(target.id);
      const cpt = compteurs.find((c) => c.id === target.compteurId);
      const prev = cpt ? cpt.dernierIndex : 0;
      setNouvelIndex(prev + 15); // default hint
      setReleveError(null);
    }
    setShowAddReleveModal(true);
  };

  const handleSaveReleve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAbonne || !selectedCompteur) {
      setReleveError('Cet abonné n a pas de compteur assigné.');
      return;
    }

    if (nouvelIndex < ancienIndex) {
      setReleveError(
        `Incohérence d index: Le nouvel index (${nouvelIndex}) ne peut être inférieur à l ancien (${ancienIndex}).`
      );
      return;
    }

    const res = store.enregistrerReleve({
      forageId: selectedAbonne.forageId,
      abonneId: selectedAbonne.id,
      compteurId: selectedCompteur.id,
      ancienIndex,
      nouvelIndex: Number(nouvelIndex),
      motifCorrection: motifCorrection || undefined,
    });

    if (!res.success) {
      setReleveError(res.message);
      return;
    }

    if (autoGenFacture && res.releve) {
      store.genererFactureDepuisReleve(res.releve.id);
    }

    setShowAddReleveModal(false);
    setMotifCorrection('');
    setReleveError(null);
  };

  const handleSaveCompteur = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numSerie) {
      toast.error('Veuillez renseigner le numéro de série du compteur.');
      return;
    }

    const newCpt = store.addCompteur({
      forageId: forages[0]?.id,
      abonneId: assignAbonneId || undefined,
      numeroSerie: numSerie,
      marque,
      diametreMm: Number(diametre),
      dateInstallation: new Date().toISOString().split('T')[0],
      statut: 'ACTIF',
      dernierIndex: Number(initialIndex),
    });

    if (assignAbonneId) {
      store.updateAbonne(assignAbonneId, { compteurId: newCpt.id });
    }

    setShowAddCompteurModal(false);
    setNumSerie('');
  };

  const canRecordReleve = ['ADMIN_ORG', 'ADMIN_FORAGE', 'RELEVEUR'].includes(currentUser.role);

  return (
    <div className="space-y-6">
      {/* Title & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#082F49] dark:text-cyan-300 flex items-center gap-2">
            <Gauge className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            Compteurs & Tournée de Relevés d'Index
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Calcul automatique des consommations m³ et détection des anomalies d'index en temps réel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canRecordReleve && (
            <>
              <button
                onClick={() => {
                  setScannerAbonneId(undefined);
                  setShowScannerModal(true);
                }}
                className="bg-gradient-to-r from-cyan-500 via-sky-500 to-cyan-600 hover:from-cyan-400 hover:to-sky-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 shadow-md cursor-pointer"
                title="Scanner le cadran du compteur avec la caméra ou importer une photo"
              >
                <Camera className="w-4 h-4 text-slate-950" />
                <span>Scanner / Photographier le compteur</span>
              </button>

              <button
                onClick={() => handleOpenNewReleve()}
                className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4 text-cyan-600" />
                <span>Saisie manuelle</span>
              </button>
            </>
          )}

          <button
            onClick={() => setShowAddCompteurModal(true)}
            className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span>Nouveau compteur</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('releves')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'releves'
              ? 'border-cyan-600 dark:border-cyan-400 text-cyan-700 dark:text-cyan-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>Historique des Relevés</span>
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full text-[10px]">
            {releves.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('compteurs')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'compteurs'
              ? 'border-cyan-600 dark:border-cyan-400 text-cyan-700 dark:text-cyan-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>Parc des Compteurs</span>
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full text-[10px]">
            {compteurs.length}
          </span>
        </button>
      </div>

      {/* TAB 1: RELEVES */}
      {activeTab === 'releves' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Abonné</th>
                  <th className="py-3 px-4">Ancien Index</th>
                  <th className="py-3 px-4">Nouvel Index</th>
                  <th className="py-3 px-4">Consommation</th>
                  <th className="py-3 px-4">Photo Preuve</th>
                  <th className="py-3 px-4">Agent Releveur</th>
                  <th className="py-3 px-4">Statut / Contrôle</th>
                  <th className="py-3 px-4 text-right">Facture</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {releves.map((releve) => {
                  const isAnomalie = releve.statut.includes('ANOMALIE');
                  return (
                    <tr key={releve.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                        {releve.dateReleve}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {releve.abonneNom}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                        {releve.ancienIndex} m³
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-sky-900 dark:text-cyan-300">
                        {releve.nouvelIndex} m³
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800 font-mono">
                          +{releve.consommationM3} m³
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {releve.photoPreuveUrl ? (
                          <button
                            type="button"
                            onClick={() => setPreviewPhotoUrl(releve.photoPreuveUrl!)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/60 dark:hover:bg-cyan-900 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 text-[11px] font-bold transition cursor-pointer"
                            title="Voir la photo-preuve certifiée du cadran"
                          >
                            <Camera className="w-3.5 h-3.5 text-cyan-600" />
                            <span>Photo cadran</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                            Saisie manuelle
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {releve.agentNom}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isAnomalie
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          {releve.statut}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {releve.factureCreee ? (
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Facturée
                          </span>
                        ) : (
                          <button
                            onClick={() => store.genererFactureDepuisReleve(releve.id)}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white px-2.5 py-1 rounded text-[11px] font-bold transition shadow-sm cursor-pointer"
                          >
                            Émettre facture
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: COMPTEURS */}
      {activeTab === 'compteurs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {compteurs.map((cpt) => {
            const abonne = abonnes.find((a) => a.compteurId === cpt.id);
            return (
              <div
                key={cpt.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-sky-800 dark:text-cyan-300 bg-sky-50 dark:bg-sky-950/50 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                      N° {cpt.numeroSerie}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      {cpt.statut}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{cpt.marque}</h3>
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Diamètre: DN {cpt.diametreMm} mm</div>

                  <div className="my-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Dernier index relevé :</span>
                    <strong className="text-base font-extrabold text-[#082F49] dark:text-cyan-300 font-mono">
                      {cpt.dernierIndex} m³
                    </strong>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    <div>
                      Abonné :{' '}
                      {abonne ? (
                        <strong className="text-slate-900 dark:text-slate-100">
                          {abonne.prenom} {abonne.nom} ({abonne.codeAbonne})
                        </strong>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 italic">Non rattaché à un abonné</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500">
                      Installé le : {cpt.dateInstallation}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  {abonne && (
                    <>
                      <button
                        onClick={() => {
                          setScannerAbonneId(abonne.id);
                          setShowScannerModal(true);
                        }}
                        className="text-cyan-700 dark:text-cyan-300 hover:text-cyan-800 font-bold flex items-center gap-1.5 cursor-pointer bg-cyan-50 dark:bg-cyan-950/40 px-2.5 py-1 rounded-lg border border-cyan-200 dark:border-cyan-800 transition"
                      >
                        <Camera className="w-3.5 h-3.5 text-cyan-600" />
                        <span>Scanner cadran</span>
                      </button>

                      <button
                        onClick={() => handleOpenNewReleve(abonne)}
                        className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <span>Saisie manuelle</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Saisie Relevé */}
      {showAddReleveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-[#082F49] dark:text-cyan-300 mb-4 flex items-center gap-2">
              <Gauge className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              Saisie du Relevé d'Index Compteur
            </h3>

            {releveError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{releveError}</span>
              </div>
            )}

            <form onSubmit={handleSaveReleve} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Sélectionner l'abonné</label>
                <select
                  value={selectedAbonneId}
                  onChange={(e) => {
                    setSelectedAbonneId(e.target.value);
                    const ab = abonnes.find((a) => a.id === e.target.value);
                    const cpt = compteurs.find((c) => c.id === ab?.compteurId);
                    const prev = cpt ? cpt.dernierIndex : 0;
                    setNouvelIndex(prev + 10);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                >
                  {abonnes.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.codeAbonne} - {a.prenom} {a.nom} ({a.quartier})
                    </option>
                  ))}
                </select>
              </div>

              {/* Index details card */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Ancien Index (Dernier relevé)</span>
                  <div className="text-xl font-extrabold text-slate-700 dark:text-slate-200 font-mono mt-1">
                    {ancienIndex} m³
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 dark:text-slate-300 font-bold">Nouvel Index lu *</label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddReleveModal(false);
                        setScannerAbonneId(selectedAbonneId);
                        setShowScannerModal(true);
                      }}
                      className="text-cyan-700 dark:text-cyan-400 hover:underline text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-cyan-600" />
                      <span>Photographier cadran</span>
                    </button>
                  </div>
                  <input
                    type="number"
                    required
                    min={ancienIndex}
                    value={nouvelIndex}
                    onChange={(e) => setNouvelIndex(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border-2 border-cyan-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-lg font-bold font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
              </div>

              {/* Live Consumption calculation */}
              <div className="p-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-800 flex items-center justify-between">
                <div>
                  <span className="text-cyan-900 dark:text-cyan-200 font-medium text-xs">Consommation calculée :</span>
                  <div className="text-[10px] text-cyan-700 dark:text-cyan-400">Calcul automatique = Nouvel Index - Ancien Index</div>
                </div>
                <div className="text-2xl font-black text-cyan-800 dark:text-cyan-300 font-mono">
                  {consommationCalculee} m³
                </div>
              </div>

              {consommationCalculee > 100 && (
                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[11px] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Alerte : Surconsommation anormale (&gt; 100 m³). Veuillez vérifier le compteur.</span>
                </div>
              )}

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Motif ou observation (Optionnel)</label>
                <input
                  type="text"
                  placeholder="Ex: Compteur propre, index bien lisible"
                  value={motifCorrection}
                  onChange={(e) => setMotifCorrection(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={autoGenFacture}
                    onChange={(e) => setAutoGenFacture(e.target.checked)}
                    className="rounded text-cyan-600 focus:ring-cyan-500"
                  />
                  <span>Générer immédiatement la facture d'eau correspondante</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddReleveModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer"
                >
                  Valider le relevé
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nouveau Compteur */}
      {showAddCompteurModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-[#082F49] dark:text-cyan-300 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              Enregistrer un Nouveau Compteur
            </h3>

            <form onSubmit={handleSaveCompteur} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Numéro de série / Matricule *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: ITRON-2026-9921"
                  value={numSerie}
                  onChange={(e) => setNumSerie(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Marque / Modèle</label>
                  <input
                    type="text"
                    value={marque}
                    onChange={(e) => setMarque(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Diamètre nominal (DN)</label>
                  <select
                    value={diametre}
                    onChange={(e) => setDiametre(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value={15}>15 mm (Standard domestique)</option>
                    <option value={20}>20 mm (Commercial)</option>
                    <option value={25}>25 mm (Gros débit)</option>
                    <option value={50}>50 mm (Borne / Gros usager)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Index initial de pose (m³)</label>
                <input
                  type="number"
                  min={0}
                  value={initialIndex}
                  onChange={(e) => setInitialIndex(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Assigner à un abonné (Optionnel)</label>
                <select
                  value={assignAbonneId}
                  onChange={(e) => setAssignAbonneId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Aucun (Laisser en stock)</option>
                  {abonnes.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.codeAbonne} - {a.prenom} {a.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCompteurModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer"
                >
                  Créer le compteur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Scanner / Photo Compteur */}
      <CompteurPhotoScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        preselectedAbonneId={scannerAbonneId}
      />

      {/* Lightbox / Preview Photo Preuve Modal */}
      {previewPhotoUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-600" />
                <h4 className="text-sm font-extrabold text-[#082F49] dark:text-white">
                  Photo Preuve du Cadran Compteur
                </h4>
              </div>
              <button
                onClick={() => setPreviewPhotoUrl(null)}
                className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <div className="rounded-xl overflow-hidden bg-slate-950 aspect-[4/3] flex items-center justify-center border border-slate-800">
                <img
                  src={previewPhotoUrl}
                  alt="Preuve cadran compteur"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Capture certifiée horodatée</span>
                <button
                  onClick={() => setPreviewPhotoUrl(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
