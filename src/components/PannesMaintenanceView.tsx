import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  DollarSign,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { store } from '../services/store';
import { toast } from '../services/toastService';
import { Panne, GravitePanne } from '../types';

export const PannesMaintenanceView: React.FC = () => {
  const [pannes, setPannes] = useState<Panne[]>(store.getPannes());
  const [showAddModal, setShowAddModal] = useState(false);
  const [resolvingPanne, setResolvingPanne] = useState<Panne | null>(null);

  // Form Panne
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [gravite, setGravite] = useState<GravitePanne>('MOYENNE');
  const [forages, setForages] = useState(store.getForages());
  const [forageId, setForageId] = useState(forages[0]?.id || '');

  // Form Resolution
  const [technicien, setTechnicien] = useState('Gorgui Faye (Plombier certifié)');
  const [cout, setCout] = useState<number>(35000);
  const [creerDepense, setCreerDepense] = useState(true);

  const currentUser = store.getCurrentUser();

  React.useEffect(() => {
    return store.subscribe(() => {
      setPannes(store.getPannes());
      setForages(store.getForages());
    });
  }, []);

  const handleSignaler = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre || !description) {
      toast.error("Veuillez renseigner le titre et la description de l'incident.");
      return;
    }

    store.signalerPanne({
      forageId,
      titre,
      description,
      gravite,
    });

    setShowAddModal(false);
    setTitre('');
    setDescription('');
  };

  const handleConfirmerResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingPanne) return;

    store.resoudrePanne({
      panneId: resolvingPanne.id,
      technicien,
      coutReparationFCFA: Number(cout),
      creerDepense,
    });

    setResolvingPanne(null);
  };

  const canSignal = ['ADMIN_ORG', 'ADMIN_FORAGE', 'RELEVEUR', 'TRESORIER'].includes(currentUser.role);
  const canResolve = ['ADMIN_ORG', 'ADMIN_FORAGE'].includes(currentUser.role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#082F49] dark:text-cyan-300 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Gestion des Pannes & Maintenance Technique
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Signalement d'incidents, interventions de plomberie/électricité et rattachement aux dépenses de caisse.
          </p>
        </div>

        {canSignal && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Signaler une panne</span>
          </button>
        )}
      </div>

      {/* Grid of Pannes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pannes.map((panne) => {
          const isRepare = panne.statut === 'REPARE';
          const isEnCours = panne.statut === 'EN_COURS';

          return (
            <div
              key={panne.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      panne.gravite === 'HAUTE'
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                        : panne.gravite === 'MOYENNE'
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Priorité {panne.gravite}
                  </span>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isRepare
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                        : isEnCours
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    {panne.statut}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{panne.titre}</h3>
                <div className="text-xs text-sky-800 dark:text-cyan-300 font-semibold mt-0.5">{panne.forageNom}</div>

                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                  {panne.description}
                </p>

                <div className="mt-4 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <div>Signalé par : <strong className="text-slate-800 dark:text-slate-200">{panne.signalePar}</strong></div>
                  <div>Date : {panne.dateSignalement}</div>
                  {panne.technicienAssigne && (
                    <div className="text-slate-800 dark:text-slate-200">
                      Technicien : <strong>{panne.technicienAssigne}</strong>
                    </div>
                  )}
                  {panne.coutReparationFCFA !== undefined && panne.coutReparationFCFA > 0 && (
                    <div className="text-emerald-700 dark:text-emerald-400 font-bold font-mono">
                      Coût réparation : {panne.coutReparationFCFA.toLocaleString('fr-FR')} FCFA
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                {isRepare ? (
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Réparé le {panne.dateResolution?.split(' ')[0]}
                  </span>
                ) : (
                  canResolve && (
                    <button
                      onClick={() => setResolvingPanne(panne)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      Clôturer & Noter réparation
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Signalement */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-[#082F49] dark:text-cyan-300 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Signaler une Panne ou Incident Technique
            </h3>

            <form onSubmit={handleSignaler} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Forage concerné *</label>
                <select
                  value={forageId}
                  onChange={(e) => setForageId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                >
                  {forages.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nom} ({f.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Titre de la panne *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fuite sous pression sur conduite principale Quartier Sud"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Niveau de gravité *</label>
                <select
                  value={gravite}
                  onChange={(e) => setGravite(e.target.value as GravitePanne)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                >
                  <option value="HAUTE">HAUTE (Arrêt d'eau ou fuite majeure)</option>
                  <option value="MOYENNE">MOYENNE (Baisse de pression, anomalie onduleur)</option>
                  <option value="BASSE">BASSE (Entretien préventif, robinet fuyard)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Description détaillée du problème *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Décrivez les symptômes, le lieu précis et les pièces potentiellement requises..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer"
                >
                  Signaler l incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Résolution */}
      {resolvingPanne && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-[#082F49] dark:text-cyan-300 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Résolution de la Panne
            </h3>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 mb-4 text-xs">
              <strong className="text-slate-900 dark:text-slate-100">{resolvingPanne.titre}</strong>
              <div className="text-slate-500 dark:text-slate-400 mt-1">{resolvingPanne.forageNom}</div>
            </div>

            <form onSubmit={handleConfirmerResolution} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Technicien / Plombier intervenant *</label>
                <input
                  type="text"
                  required
                  value={technicien}
                  onChange={(e) => setTechnicien(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Coût total de l'intervention (FCFA)</label>
                <input
                  type="number"
                  min={0}
                  value={cout}
                  onChange={(e) => setCout(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={creerDepense}
                    onChange={(e) => setCreerDepense(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Créer automatiquement la demande de dépense associée en Caisse</span>
                </label>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 ml-6">
                  Le solde de caisse ne diminuera qu'après validation formelle de la dépense par le trésorier.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setResolvingPanne(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                >
                  Valider la réparation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
