import React, { useState } from 'react';
import {
  Droplets,
  Plus,
  CheckCircle2,
  Calendar,
  User,
  DollarSign,
  TrendingUp,
  Receipt,
  ArrowRight,
} from 'lucide-react';
import { store } from '../services/store';
import { toast } from '../services/toastService';
import { BorneFontaine, VenteBorne, VersementFontainier } from '../types';
import { formatFCFA } from '../utils/formatters';

export const BornesFontainesView: React.FC = () => {
  const [bornes, setBornes] = useState<BorneFontaine[]>(store.getBornes());
  const [ventes, setVentes] = useState<VenteBorne[]>(store.getVentesBornes());
  const [versements, setVersements] = useState<VersementFontainier[]>(store.getVersementsBornes());
  const [showVenteModal, setShowVenteModal] = useState(false);
  const [showVersementModal, setShowVersementModal] = useState(false);

  // Form Vente
  const [selectedBorneId, setSelectedBorneId] = useState(bornes[0]?.id || '');
  const [bassines, setBassines] = useState(100);

  // Form Versement
  const [versementBorneId, setVersementBorneId] = useState(bornes[0]?.id || '');
  const [versementMontant, setVersementMontant] = useState(10000);

  const currentUser = store.getCurrentUser();

  React.useEffect(() => {
    return store.subscribe(() => {
      setBornes(store.getBornes());
      setVentes(store.getVentesBornes());
      setVersements(store.getVersementsBornes());
    });
  }, []);

  const totalVentesFCFA = ventes.reduce((sum, v) => sum + v.totalVenteFCFA, 0);
  const totalVersesFCFA = versements.reduce((sum, v) => sum + v.montantVerseFCFA, 0);
  const resteAVerserGlobal = Math.max(0, totalVentesFCFA - totalVersesFCFA);

  const handleEnregistrerVente = (e: React.FormEvent) => {
    e.preventDefault();
    if (bassines <= 0) {
      toast.error('La quantité de bassines doit être supérieure à zéro.');
      return;
    }

    store.enregistrerVenteBorne({
      borneId: selectedBorneId,
      quantiteBassines: Number(bassines),
    });

    toast.success('Vente de borne enregistrée avec succès.');
    setShowVenteModal(false);
    setBassines(100);
  };

  const handleEnregistrerVersement = (e: React.FormEvent) => {
    e.preventDefault();
    if (versementMontant <= 0) {
      toast.error('Le montant du versement doit être supérieur à zéro.');
      return;
    }

    const b = bornes.find((item) => item.id === versementBorneId);
    store.enregistrerVersementFontainier({
      borneId: versementBorneId,
      fontainierId: b?.fontainierId || currentUser.id,
      montantFCFA: Number(versementMontant),
    });

    setShowVersementModal(false);
  };

  const canManageBorne = ['ADMIN_ORG', 'ADMIN_FORAGE', 'TRESORIER', 'FONTAINIER'].includes(currentUser.role);
  const canReceiveVersement = ['ADMIN_ORG', 'TRESORIER'].includes(currentUser.role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#082F49] dark:text-cyan-300 flex items-center gap-2">
            <Droplets className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            Gestion des Bornes-Fontaines & Ventes au Détail
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Comptabilité distincte des ventes journalières et des versements reversés à la caisse de l'ASUFOR.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canManageBorne && (
            <button
              onClick={() => setShowVenteModal(true)}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Saisir une vente journalière</span>
            </button>
          )}

          {canReceiveVersement && (
            <button
              onClick={() => setShowVersementModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer"
            >
              <DollarSign className="w-4 h-4" />
              <span>Recevoir un versement fontainier</span>
            </button>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ventes globales enregistrées</div>
          <div className="text-2xl font-extrabold text-[#082F49] dark:text-cyan-300 mt-1">
            {formatFCFA(totalVentesFCFA)}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Total bassines et bidons 20L
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Versements encaissés en caisse</div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatFCFA(totalVersesFCFA)}
          </div>
          <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Reçus officiels validés
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Reste à verser par les fontainiers</div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {formatFCFA(resteAVerserGlobal)}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">Solde à recouvrer</div>
        </div>
      </div>

      {/* Bornes Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {bornes.map((borne) => {
          const ventesBorne = ventes.filter((v) => v.borneId === borne.id);
          const versementsBorne = versements.filter((v) => v.borneId === borne.id);
          const totalV = ventesBorne.reduce((s, v) => s + v.totalVenteFCFA, 0);
          const totalVers = versementsBorne.reduce((s, v) => s + v.montantVerseFCFA, 0);
          const reste = Math.max(0, totalV - totalVers);

          return (
            <div
              key={borne.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-sky-800 dark:text-cyan-300 bg-sky-50 dark:bg-sky-950/50 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                    {borne.code}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    {borne.statut}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{borne.nom}</h3>
                <div className="text-xs text-slate-500 dark:text-slate-400">{borne.quartier}</div>

                <div className="grid grid-cols-2 gap-3 my-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Prix par bassine (20L)</span>
                    <strong className="text-slate-800 dark:text-slate-200">{borne.prixBassineFCFA} FCFA</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Fontainier responsable</span>
                    <strong className="text-slate-800 dark:text-slate-200">{borne.fontainierNom || 'Non assigné'}</strong>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Ventes cumulées :</span>
                    <strong className="font-mono text-slate-800 dark:text-slate-200">{formatFCFA(totalV)}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Versements au trésorier :</span>
                    <strong className="font-mono text-emerald-600 dark:text-emerald-400">{formatFCFA(totalVers)}</strong>
                  </div>
                  <div className="flex justify-between text-slate-900 dark:text-slate-100 font-bold border-t border-slate-100 dark:border-slate-800 pt-1">
                    <span>Reste à verser :</span>
                    <span className="font-mono text-amber-600 dark:text-amber-400 font-extrabold">
                      {formatFCFA(reste)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 text-xs">
                {canManageBorne && (
                  <button
                    onClick={() => {
                      setSelectedBorneId(borne.id);
                      setShowVenteModal(true);
                    }}
                    className="text-cyan-700 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300 font-bold cursor-pointer"
                  >
                    Ajouter vente
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Vente */}
      {showVenteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-[#082F49] dark:text-cyan-300 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              Saisie des Ventes du Jour (Borne-Fontaine)
            </h3>

            <form onSubmit={handleEnregistrerVente} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Borne-Fontaine *</label>
                <select
                  value={selectedBorneId}
                  onChange={(e) => setSelectedBorneId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-semibold"
                >
                  {bornes.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nom} ({b.prixBassineFCFA} F / bassine)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                  Nombre de bassines (ou bidons de 20L) vendus *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={bassines}
                  onChange={(e) => setBassines(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-base font-bold"
                />
              </div>

              {/* Total Calculation */}
              <div className="p-3.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-800 flex items-center justify-between">
                <div>
                  <span className="text-cyan-900 dark:text-cyan-200 font-medium">Recette calculée :</span>
                  <div className="text-[10px] text-cyan-700 dark:text-cyan-400">Prix unitaire 25 FCFA / bassine</div>
                </div>
                <div className="text-xl font-extrabold text-cyan-800 dark:text-cyan-300 font-mono">
                  {formatFCFA(bassines * 25)}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowVenteModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer"
                >
                  Enregistrer la vente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Versement Fontainier */}
      {showVersementModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-[#082F49] dark:text-cyan-300 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Réception de Versement Fontainier
            </h3>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">
              Ce versement sera automatiquement crédité dans la caisse principale en espèces avec quittance certifiée.
            </p>

            <form onSubmit={handleEnregistrerVersement} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Borne concernée *</label>
                <select
                  value={versementBorneId}
                  onChange={(e) => setVersementBorneId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  {bornes.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nom} • Fontainier: {b.fontainierNom || 'N/A'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Montant versé en espèces (FCFA) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={versementMontant}
                  onChange={(e) => setVersementMontant(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-base font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowVersementModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                >
                  Valider le versement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
