import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRightLeft,
  FileText,
  DollarSign,
  Fuel,
  Zap,
  Wrench,
  Users,
  Building,
  Image as ImageIcon,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { store } from '../services/store';
import { toast } from '../services/toastService';
import { Depense, CompteTresorerie, CategorieDepense, MouvementTresorerie } from '../types';

export const DepensesCaisseView: React.FC = () => {
  const [comptes, setComptes] = useState<CompteTresorerie[]>(store.getComptes());
  const [depenses, setDepenses] = useState<Depense[]>(store.getDepenses());
  const [mouvements, setMouvements] = useState<MouvementTresorerie[]>(store.getMouvements());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [cancellingDepenseId, setCancellingDepenseId] = useState<string | null>(null);
  const [cancelMotif, setCancelMotif] = useState('');
  const [previewJustificatif, setPreviewJustificatif] = useState<string | null>(null);

  // Form Depense
  const [categorie, setCategorie] = useState<CategorieDepense>('CARBURANT');
  const [description, setDescription] = useState('');
  const [montant, setMontant] = useState<number>(0);
  const [compteId, setCompteId] = useState(comptes[0]?.id || '');
  const [justificatifUrl, setJustificatifUrl] = useState('');

  // Form Transfer
  const [sourceId, setSourceId] = useState(comptes[0]?.id || '');
  const [destId, setDestId] = useState(comptes[1]?.id || '');
  const [transferMontant, setTransferMontant] = useState<number>(0);
  const [transferDesc, setTransferDesc] = useState('Dépôt caisse vers compte bancaire');

  const currentUser = store.getCurrentUser();
  const forages = store.getForages();

  React.useEffect(() => {
    return store.subscribe(() => {
      setComptes(store.getComptes());
      setDepenses(store.getDepenses());
      setMouvements(store.getMouvements());
    });
  }, []);

  const totalCaisse = comptes.reduce((sum, c) => sum + c.soldeActuelFCFA, 0);

  const handleCreateDepense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || montant <= 0) {
      toast.error('Veuillez renseigner la description et un montant valide.');
      return;
    }

    store.ajouterDepense({
      forageId: forages[0]?.id,
      categorie,
      description,
      montantFCFA: Number(montant),
      compteTresorerieId: compteId || comptes[0]?.id,
      justificatifUrl: justificatifUrl || undefined,
    });

    toast.success('Dépense enregistrée avec succès.');
    setShowAddModal(false);
    setDescription('');
    setMontant(0);
    setJustificatifUrl('');
  };

  const handleValider = (id: string) => {
    const res = store.validerDepense(id);
    if (!res.success) {
      toast.error(res.message);
    } else {
      toast.success('Dépense validée avec succès.');
    }
  };

  const handleConfirmerAnnulation = () => {
    if (!cancellingDepenseId) return;
    const res = store.annulerDepense(cancellingDepenseId, cancelMotif);
    if (!res.success) {
      toast.error(res.message);
      return;
    }
    toast.success('Dépense annulée de façon traçable.');
    setCancellingDepenseId(null);
    setCancelMotif('');
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (transferMontant <= 0) {
      toast.error('Le montant du transfert doit être supérieur à zéro.');
      return;
    }
    const res = store.effectuerTransfertInterne({
      compteSourceId: sourceId,
      compteDestId: destId,
      montantFCFA: Number(transferMontant),
      description: transferDesc,
    });
    if (!res.success) {
      toast.error(res.message);
      return;
    }
    toast.success('Transfert de trésorerie interne exécuté avec succès.');
    setShowTransferModal(false);
    setTransferMontant(0);
  };

  const canManageCaisse = store.canWriteFinancial();

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#082F49] dark:text-cyan-300 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            Caisse, Trésorerie & Dépenses
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gouvernance financière rigoureuse : zéro suppression physique, justificatifs et validations formelles.
          </p>
        </div>

        {canManageCaisse && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTransferModal(true)}
              className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Virement interne</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle dépense</span>
            </button>
          </div>
        )}
      </div>

      {/* Comptes de Trésorerie Cards - High Contrast */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {comptes.map((compte) => {
          const isEspeces = compte.type === 'ESPECES';
          const isMM = compte.type === 'MOBILE_MONEY';
          const isBanque = compte.type === 'BANQUE';

          return (
            <div
              key={compte.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200/90 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300">
                    {compte.type.replace('_', ' ')}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                      isEspeces
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                        : isMM
                        ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-cyan-300 border border-sky-300 dark:border-sky-700'
                        : 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700'
                    }`}
                  >
                    {isEspeces && <DollarSign className="w-4 h-4" />}
                    {isMM && <Wallet className="w-4 h-4" />}
                    {isBanque && <Building className="w-4 h-4" />}
                  </div>
                </div>

                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{compte.nom}</h3>
                {compte.numeroCompte && (
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                    N° {compte.numeroCompte}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3.5 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Solde disponible :</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-300 font-mono tracking-tight">
                  {compte.soldeActuelFCFA.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dépenses Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Registre des Dépenses & Décaissements</h3>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Total validé :{' '}
            <strong className="text-rose-600 dark:text-rose-400 font-mono">
              {depenses
                .filter((d) => d.statut === 'VALIDEE')
                .reduce((s, d) => s + d.montantFCFA, 0)
                .toLocaleString('fr-FR')}{' '}
              FCFA
            </strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Catégorie</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Compte Imputé</th>
                <th className="py-3 px-4">Montant</th>
                <th className="py-3 px-4">Justificatif</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {depenses.map((depense) => {
                const isValid = depense.statut === 'VALIDEE';
                const isAnnulee = depense.statut === 'ANNULEE';

                return (
                  <tr key={depense.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">{depense.dateDepense}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {depense.categorie}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200 max-w-xs">
                      {depense.description}
                      {depense.motifAnnulation && (
                        <span className="block text-[10px] text-rose-500 dark:text-rose-400 italic mt-0.5">
                          Motif annulation : {depense.motifAnnulation}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-[11px]">{depense.compteNom}</td>
                    <td className="py-3.5 px-4 font-extrabold text-rose-600 dark:text-rose-400 font-mono text-sm">
                      - {depense.montantFCFA.toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="py-3.5 px-4">
                      {depense.justificatifUrl ? (
                        <button
                          onClick={() => setPreviewJustificatif(depense.justificatifUrl || null)}
                          className="text-[11px] text-cyan-700 dark:text-cyan-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Voir reçu</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Sans pièce</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isValid
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            : isAnnulee
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {depense.statut}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {depense.statut === 'EN_ATTENTE' && canManageCaisse && (
                          <button
                            onClick={() => handleValider(depense.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded text-[10px] font-bold transition shadow-sm cursor-pointer"
                            title="Valider et décaisser les fonds"
                          >
                            Valider
                          </button>
                        )}

                        {!isAnnulee && canManageCaisse && (
                          <button
                            onClick={() => {
                              setCancellingDepenseId(depense.id);
                              setCancelMotif('');
                            }}
                            className="p-1 rounded text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[10px] font-semibold transition"
                            title="Annulation motivée"
                          >
                            Annuler
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

      {/* Mouvements de Trésorerie (Flux financiers) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Grand Livre des Mouvements de Trésorerie</h3>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500">Traçabilité complète</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-64 overflow-y-auto">
          {mouvements.map((m) => {
            const isEncaissement = m.type === 'ENCAISSEMENT';
            const isDecaissement = m.type === 'DECAISSEMENT';

            return (
              <div key={m.id} className="p-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold ${
                      isEncaissement
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                        : isDecaissement
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                        : 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300'
                    }`}
                  >
                    {isEncaissement ? '+' : isDecaissement ? '-' : '⇄'}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{m.libelle}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      Réf: {m.referenceDoc} • {m.dateMouvement}
                    </div>
                  </div>
                </div>

                <div
                  className={`font-mono font-extrabold text-sm ${
                    isEncaissement ? 'text-emerald-600 dark:text-emerald-400' : isDecaissement ? 'text-rose-600 dark:text-rose-400' : 'text-sky-700 dark:text-sky-400'
                  }`}
                >
                  {isEncaissement ? '+' : isDecaissement ? '-' : ''}
                  {m.montantFCFA.toLocaleString('fr-FR')} FCFA
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Ajout Dépense */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-[#082F49] dark:text-cyan-300 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              Enregistrer une Nouvelle Dépense
            </h3>

            <form onSubmit={handleCreateDepense} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Catégorie *</label>
                  <select
                    value={categorie}
                    onChange={(e) => setCategorie(e.target.value as CategorieDepense)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-semibold"
                  >
                    <option value="CARBURANT">Carburant / Gasoil Groupe</option>
                    <option value="ELECTRICITE">Électricité Réseau Senelec</option>
                    <option value="REPARATION">Réparation & Pièces Pompe</option>
                    <option value="SALAIRE">Salaire & Primes Agents</option>
                    <option value="ENTRETIEN">Entretien Réseau & Vannes</option>
                    <option value="REDEVANCE">Redevance DGPRE / OFOR</option>
                    <option value="AUTRE">Autre dépense</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Compte de décaissement *</label>
                  <select
                    value={compteId}
                    onChange={(e) => setCompteId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {comptes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nom} (Solde: {c.soldeActuelFCFA.toLocaleString('fr-FR')} F)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Montant de la dépense (FCFA) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={montant}
                  onChange={(e) => setMontant(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Description / Motif explicite *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Ex: Achat de 100L de gasoil à la station Total pour alimenter le groupe électrogène"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                  URL ou référence du justificatif photo (Facture/Reçu)
                </label>
                <input
                  type="url"
                  placeholder="https://... ou téléversement sécurisé"
                  value={justificatifUrl}
                  onChange={(e) => setJustificatifUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-[11px]"
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
                  Créer la demande
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Virement Interne */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-[#082F49] dark:text-cyan-300 mb-4 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              Virement Interne de Trésorerie
            </h3>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">
              Les virements internes transfèrent des liquidités entre comptes sans altérer le résultat d'exploitation (pas de double comptabilisation).
            </p>

            <form onSubmit={handleExecuteTransfer} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Compte Source (Débit)</label>
                <select
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {comptes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nom} ({c.soldeActuelFCFA.toLocaleString('fr-FR')} FCFA)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Compte Bénéficiaire (Crédit)</label>
                <select
                  value={destId}
                  onChange={(e) => setDestId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {comptes
                    .filter((c) => c.id !== sourceId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nom} ({c.soldeActuelFCFA.toLocaleString('fr-FR')} FCFA)
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Montant du transfert (FCFA) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={transferMontant}
                  onChange={(e) => setTransferMontant(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Motif</label>
                <input
                  type="text"
                  value={transferDesc}
                  onChange={(e) => setTransferDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer"
                >
                  Exécuter le transfert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Annulation Motivée */}
      {cancellingDepenseId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              Annulation Formelle d'une Écriture Financière
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
              Conformément aux règles de gestion stricte, la dépense ne sera pas supprimée. Elle sera marquée <strong>ANNULÉE</strong> avec enregistrement au journal d'audit.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Motif d'annulation obligatoire *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Expliquez la raison de l'annulation (erreur de saisie, prestation non réalisée...)"
                  value={cancelMotif}
                  onChange={(e) => setCancelMotif(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCancellingDepenseId(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={handleConfirmerAnnulation}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
                >
                  Confirmer l'annulation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Preview Justificatif */}
      {previewJustificatif && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Pièce Justificative</span>
              <button
                onClick={() => setPreviewJustificatif(null)}
                className="text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-bold cursor-pointer"
              >
                Fermer
              </button>
            </div>
            <img
              src={previewJustificatif}
              alt="Justificatif dépense"
              className="w-full h-auto rounded-xl object-contain max-h-96"
            />
          </div>
        </div>
      )}
    </div>
  );
};
