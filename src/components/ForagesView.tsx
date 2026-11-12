import React, { useState } from 'react';
import {
  Droplets,
  Plus,
  Wrench,
  CheckCircle,
  AlertTriangle,
  Phone,
  User,
  Zap,
  Gauge,
  ArrowDown,
  Layers,
} from 'lucide-react';
import { store } from '../services/store';
import { toast } from '../services/toastService';
import { Forage, PompeType } from '../types';

export const ForagesView: React.FC = () => {
  const [forages, setForages] = useState<Forage[]>(store.getForages());
  const [showAddModal, setShowAddModal] = useState(false);
  const currentUser = store.getCurrentUser();

  React.useEffect(() => {
    return store.subscribe(() => {
      setForages(store.getForages());
    });
  }, []);

  // Form state
  const [code, setCode] = useState('');
  const [nom, setNom] = useState('');
  const [localite, setLocalite] = useState('');
  const [region, setRegion] = useState('Thiès');
  const [profondeur, setProfondeur] = useState(120);
  const [debit, setDebit] = useState(30);
  const [typePompe, setTypePompe] = useState<PompeType>('SOLAIRE');
  const [puissance, setPuissance] = useState(20);
  const [responsable, setResponsable] = useState('');
  const [telephone, setTelephone] = useState('+221 ');
  const [tarifM3, setTarifM3] = useState(350);
  const [redevanceFixe, setRedevanceFixe] = useState(500);

  const handleCreateForage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !code || !localite) {
      toast.error('Veuillez renseigner le code, le nom et la localité du forage.');
      return;
    }

    store.addForage({
      code,
      nom,
      localite,
      region,
      profondeurMetres: Number(profondeur),
      debitNominalM3H: Number(debit),
      typePompe,
      puissanceKw: Number(puissance),
      dateMiseEnService: new Date().toISOString().split('T')[0],
      responsableNom: responsable,
      responsableTel: telephone,
      statut: 'EN_SERVICE',
      tarifM3FCFA: Number(tarifM3),
      redevanceFixeFCFA: Number(redevanceFixe),
    });

    setShowAddModal(false);
    setCode('');
    setNom('');
    setLocalite('');
  };

  const handleToggleStatut = (forage: Forage) => {
    const nextStatut =
      forage.statut === 'EN_SERVICE'
        ? 'EN_MAINTENANCE'
        : forage.statut === 'EN_MAINTENANCE'
        ? 'EN_PANNE'
        : 'EN_SERVICE';

    store.updateForage(forage.id, { statut: nextStatut });
  };

  const canEdit = ['ADMIN_ORG', 'ADMIN_FORAGE'].includes(currentUser.role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#082F49] flex items-center gap-2">
            <Droplets className="w-6 h-6 text-cyan-600" />
            Gestion des Forages & Équipements Hydrauliques
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Suivi des caractéristiques techniques, débits, pompes solaires et tarification par forage.
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un forage</span>
          </button>
        )}
      </div>

      {/* Forages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forages.map((forage) => {
          const isEnService = forage.statut === 'EN_SERVICE';
          const isMaintenance = forage.statut === 'EN_MAINTENANCE';

          return (
            <div
              key={forage.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-colors duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Header card */}
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-cyan-300 border border-sky-200 dark:border-sky-800">
                      {forage.code}
                    </span>
                    <h3 className="text-base font-bold text-[#082F49] dark:text-white mt-1.5">{forage.nom}</h3>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{forage.localite} ({forage.region})</div>
                  </div>

                  <button
                    onClick={() => canEdit && handleToggleStatut(forage)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition flex items-center gap-1 ${
                      isEnService
                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                        : isMaintenance
                        ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                        : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                    }`}
                    title={canEdit ? 'Cliquez pour changer le statut opérationnel' : undefined}
                  >
                    {isEnService && <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                    {isMaintenance && <Wrench className="w-3 h-3 text-amber-600 dark:text-amber-400" />}
                    {!isEnService && !isMaintenance && <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />}
                    <span>{forage.statut.replace('_', ' ')}</span>
                  </button>
                </div>

                {/* Technical specs */}
                <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <ArrowDown className="w-4 h-4 text-sky-600 dark:text-cyan-400 shrink-0" />
                    <div>
                      <div className="text-slate-400 dark:text-slate-500 text-[10px]">Profondeur</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">{forage.profondeurMetres} m</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                    <div>
                      <div className="text-slate-400 dark:text-slate-500 text-[10px]">Débit nominal</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">{forage.debitNominalM3H} m³/h</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                    <div>
                      <div className="text-slate-400 dark:text-slate-500 text-[10px]">Type de pompe</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">{forage.typePompe}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-slate-400 dark:text-slate-500 text-[10px]">Tarif au m³</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">{forage.tarifM3FCFA} FCFA</div>
                    </div>
                  </div>
                </div>

                {/* Responsible */}
                <div className="mt-4 pt-2 text-xs space-y-1 text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <span>Responsable : <strong className="text-slate-800 dark:text-slate-200">{forage.responsableNom || 'Non assigné'}</strong></span>
                  </div>
                  {forage.responsableTel && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>{forage.responsableTel}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Mise en service : {forage.dateMiseEnService}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px]">Redevance: {forage.redevanceFixeFCFA} F</span>
                  {canEdit && (
                    <button
                      onClick={() => {
                        const newTarif = window.prompt(
                          `Modifier le tarif du forage ${forage.nom} (${forage.code}) :\nAncien tarif volumique : ${forage.tarifM3FCFA} FCFA/m³\nEntrez le nouveau tarif volumique (FCFA) :`,
                          String(forage.tarifM3FCFA)
                        );
                        if (newTarif && !isNaN(Number(newTarif))) {
                          const newRedev = window.prompt(
                            `Redevance fixe mensuelle (Actuelle: ${forage.redevanceFixeFCFA} FCFA) :`,
                            String(forage.redevanceFixeFCFA)
                          );
                          const motif = window.prompt(
                            `Justification obligatoire pour le journal d'audit :`,
                            `Révision tarifaire décidée en assemblée générale ASUFOR`
                          );
                          store.updateTarifForage(
                            forage.id,
                            Number(newTarif),
                            Number(newRedev || forage.redevanceFixeFCFA),
                            motif || undefined
                          );
                        }
                      }}
                      className="text-cyan-700 dark:text-cyan-400 hover:underline font-bold text-[11px] cursor-pointer"
                      title="Modifier les tarifs de ce forage (Action tracée dans l'audit)"
                    >
                      Modifier tarif
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Forage Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 transition-colors duration-200">
            <h3 className="text-lg font-bold text-[#082F49] dark:text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              Nouveau Forage Hydraulique
            </h3>

            <form onSubmit={handleCreateForage} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Code Forage *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: FRG-TT-03"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Nom du Forage *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Forage Escale Nord"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Localité / Village *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Touba Toul Centre"
                    value={localite}
                    onChange={(e) => setLocalite(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Région</label>
                  <input
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Profondeur (m)</label>
                  <input
                    type="number"
                    value={profondeur}
                    onChange={(e) => setProfondeur(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Débit (m³/h)</label>
                  <input
                    type="number"
                    value={debit}
                    onChange={(e) => setDebit(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Type de pompe</label>
                  <select
                    value={typePompe}
                    onChange={(e) => setTypePompe(e.target.value as PompeType)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="SOLAIRE">Solaire</option>
                    <option value="HYBRIDE">Hybride (Solaire + Thermique)</option>
                    <option value="THERMIQUE">Thermique (Groupe)</option>
                    <option value="ELECTRIQUE_RESEAU">Réseau Senelec</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Tarif au m³ (FCFA)</label>
                  <input
                    type="number"
                    value={tarifM3}
                    onChange={(e) => setTarifM3(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Redevance fixe mensuelle (FCFA)</label>
                  <input
                    type="number"
                    value={redevanceFixe}
                    onChange={(e) => setRedevanceFixe(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Responsable local</label>
                  <input
                    type="text"
                    placeholder="Nom du gestionnaire"
                    value={responsable}
                    onChange={(e) => setResponsable(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
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
                  Créer le forage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
