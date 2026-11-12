import React, { useState } from 'react';
import {
  AlertTriangle,
  Receipt,
  Share2,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Phone,
  PowerOff,
  RefreshCw,
  Plus,
  Send,
  MessageSquare,
} from 'lucide-react';
import { store } from '../services/store';
import { toast } from '../services/toastService';
import { Facture, CoupureProposition, Relance } from '../types';
import { smsService } from '../services/smsService';
import { SmsNotificationsModal } from './SmsNotificationsModal';

export const ImpayesCoupuresView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'impayes' | 'coupures' | 'relances'>('impayes');
  const [factures, setFactures] = useState<Facture[]>(store.getFactures());
  const [coupures, setCoupures] = useState<CoupureProposition[]>(store.getCoupures());
  const [relances, setRelances] = useState<Relance[]>(store.getRelances());
  const [showProposerModal, setShowProposerModal] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsFeedback, setSmsFeedback] = useState<string | null>(null);

  // Form Proposition Coupure
  const [selectedAbonneId, setSelectedAbonneId] = useState('');
  const [motifCoupure, setMotifCoupure] = useState('Non-paiement après 3 relances consécutives');

  const currentUser = store.getCurrentUser();
  const currentOrg = store.getCurrentOrganisation();
  const abonnes = store.getAbonnes();

  React.useEffect(() => {
    return store.subscribe(() => {
      setFactures(store.getFactures());
      setCoupures(store.getCoupures());
      setRelances(store.getRelances());
    });
  }, []);

  const impayeesFactures = factures.filter((f) => f.resteDuFCFA > 0);
  const totalDette = impayeesFactures.reduce((sum, f) => sum + f.resteDuFCFA, 0);

  const handleSendWhatsAppRelance = (facture: Facture) => {
    const text =
      `*RAPPEL DE PAIEMENT - ${currentOrg?.nom || 'ASUFOR'}*\n` +
      `Bonjour ${facture.abonneNom},\n` +
      `Votre facture N° *${facture.numeroFacture}* d'un montant de *${facture.resteDuFCFA.toLocaleString('fr-FR')} FCFA* est arrivée à échéance.\n` +
      `Merci de régulariser par Wave ou Orange Money sous 48h afin d'éviter l'interruption de votre fourniture d'eau potable.`;

    store.envoyerRelance({
      abonneId: facture.abonneId,
      factureId: facture.id,
      canal: 'WHATSAPP',
      message: text,
      montantFCFA: facture.resteDuFCFA,
    });

    const telClean = facture.abonneTel.replace(/[^0-9]/g, '');
    try {
      window.open(`https://wa.me/${telClean}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
      toast.info(`Lien WhatsApp ouvert pour ${facture.abonneNom}.`);
    } catch {
      toast.warning('Veuillez autoriser les fenêtres pop-up pour ouvrir WhatsApp.');
    }
  };

  const handleSendSmsFactureRelance = async (facture: Facture) => {
    try {
      const org = currentOrg?.nom || 'ASUFOR';
      const msg = `FACTUREAU [${org}]: Rappel de paiement. Facture ${facture.numeroFacture} (${facture.periode}) : ${facture.resteDuFCFA.toLocaleString('fr-FR')} FCFA restant dû. Merci de régulariser par Wave ou OM.`;
      await smsService.envoyerSmsPersonnalise({
        destinataireNom: facture.abonneNom,
        telephone: facture.abonneTel,
        abonneId: facture.abonneId,
        factureId: facture.id,
        type: 'RELANCE_IMPAYE',
        message: msg,
      });
      toast.success(`SMS de relance envoyé avec succès à ${facture.abonneNom} (${facture.abonneTel}) !`);
    } catch {
      toast.error("Erreur lors de l'envoi du SMS.");
    }
  };

  const handleSendSmsCoupure = async (coupure: CoupureProposition) => {
    try {
      await smsService.envoyerSmsCoupureImminente(coupure, currentOrg?.nom);
      toast.success(`SMS d'alerte coupure imminente envoyé à ${coupure.abonneNom} (${coupure.abonneTel}) !`);
    } catch {
      toast.error("Erreur lors de l'envoi du SMS.");
    }
  };

  const handleProposerCoupure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAbonneId) {
      toast.error("Veuillez sélectionner un abonné en situation d'impayé.");
      return;
    }
    const res = store.proposerCoupure(selectedAbonneId, motifCoupure);
    setShowProposerModal(false);
    if (res) {
      toast.success(
        `Dossier de coupure créé. Un SMS d'alerte urgente a été transmis à ${res.abonneNom}.`
      );
    }
  };

  const handleValiderCoupure = (coupureId: string) => {
    const res = store.validerCoupureHumaine(coupureId);
    if (!res.success) {
      toast.error(res.message);
    } else {
      toast.success(res.message + " Notification SMS d'interruption formelle expédiée.");
    }
  };

  const handleRetablir = (coupureId: string) => {
    const res = store.retablirAbonne(coupureId);
    if (!res.success) {
      toast.error(res.message);
    } else {
      toast.success(res.message);
    }
  };

  const canValidateCoupure = ['ADMIN_ORG', 'ADMIN_FORAGE'].includes(currentUser.role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#082F49] dark:text-sky-300 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            Gestion des Impayés, Relances & Coupures
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Garantie éthique : <strong>Validation humaine obligatoire</strong>. Alertes SMS automatiques aux abonnés.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowSmsModal(true)}
            className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Consulter l'historique et la passerelle SMS"
          >
            <MessageSquare className="w-4 h-4 text-rose-500" />
            <span>Passerelle SMS & Alertes</span>
          </button>

          <button
            onClick={() => setShowProposerModal(true)}
            className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer"
          >
            <PowerOff className="w-4 h-4" />
            <span>Proposer une coupure</span>
          </button>
        </div>
      </div>

      {/* SMS Feedback Toast Banner */}
      {smsFeedback && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{smsFeedback}</span>
          </div>
          <button
            onClick={() => setSmsFeedback(null)}
            className="text-xs font-bold opacity-60 hover:opacity-100 p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Créances totales exigibles</div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-500 font-mono mt-1">
            {totalDette.toLocaleString('fr-FR')} FCFA
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {impayeesFactures.length} factures en attente de solde
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Relances WhatsApp émises</div>
          <div className="text-2xl font-extrabold text-sky-700 dark:text-sky-400 font-mono mt-1">
            {relances.length} relances
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">Messages de rappel amiables</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Dossiers de coupure à examiner</div>
          <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono mt-1">
            {coupures.filter((c) => c.statut === 'PROPOSE').length} dossiers
          </div>
          <div className="text-xs text-rose-700 dark:text-rose-400 mt-1 font-semibold flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> Exige validation admin
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('impayes')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'impayes'
              ? 'border-amber-600 text-amber-700 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <span>Factures Impayées & Retards</span>
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full text-[10px]">
            {impayeesFactures.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('coupures')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'coupures'
              ? 'border-rose-600 text-rose-700 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <span>Propositions de Coupures</span>
          <span className="bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
            {coupures.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('relances')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'relances'
              ? 'border-sky-600 text-sky-700 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <span>Historique des Relances</span>
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full text-[10px]">
            {relances.length}
          </span>
        </button>
      </div>

      {/* TAB 1: IMPAYES */}
      {activeTab === 'impayes' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">N° Facture</th>
                  <th className="py-3 px-4">Abonné</th>
                  <th className="py-3 px-4">Téléphone</th>
                  <th className="py-3 px-4">Période</th>
                  <th className="py-3 px-4">Échéance</th>
                  <th className="py-3 px-4">Reste Dû</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4 text-right">Relance WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {impayeesFactures.map((fac) => {
                  const isRetard = fac.statut === 'EN_RETARD';
                  return (
                    <tr key={fac.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-sky-800 dark:text-sky-400">{fac.numeroFacture}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">{fac.abonneNom}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">{fac.abonneTel}</td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{fac.periode}</td>
                      <td className="py-3.5 px-4 text-rose-600 dark:text-rose-400 font-mono font-semibold">{fac.dateEcheance}</td>
                      <td className="py-3.5 px-4 font-black font-mono text-amber-600 dark:text-amber-400 text-sm">
                        {fac.resteDuFCFA.toLocaleString('fr-FR')} FCFA
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isRetard
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {fac.statut.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSendSmsFactureRelance(fac)}
                            className="bg-sky-600 hover:bg-sky-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-sm"
                            title="Envoyer un rappel SMS officiel de paiement"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>SMS</span>
                          </button>

                          <button
                            onClick={() => handleSendWhatsAppRelance(fac)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: COUPURES */}
      {activeTab === 'coupures' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Principe constitutionnel FACTUREAU de protection sociale de l'eau :</strong>
              <p className="mt-0.5">
                Aucun algorithme ne peut couper l'eau automatiquement. Chaque coupure doit être proposée de manière motivée, puis examinée et validée par la signature d'un administrateur responsable.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {coupures.map((c) => {
              const isPropose = c.statut === 'PROPOSE';
              const isValid = c.statut === 'VALIDEE';
              const isRetablie = c.statut === 'RETABLIE';

              return (
                <div
                  key={c.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs font-bold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                        {c.abonneCode}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isPropose
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            : isValid
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        }`}
                      >
                        {c.statut}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{c.abonneNom}</h3>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{c.abonneQuartier} • {c.abonneTel}</div>

                    <div className="my-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/60 text-xs space-y-1">
                      <div className="flex justify-between text-slate-600 dark:text-slate-300">
                        <span>Dette impayée :</span>
                        <strong className="text-rose-700 dark:text-rose-400 font-mono font-black text-sm">
                          {c.montantDetteFCFA.toLocaleString('fr-FR')} FCFA
                        </strong>
                      </div>
                      <div className="text-slate-600 dark:text-slate-300 mt-1">
                        Motif : <em>{c.motif}</em>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 dark:text-slate-500 space-y-0.5">
                      <div>Date proposition : {c.dateProposition}</div>
                      {c.validePar && <div>Validée par : <strong className="text-slate-700 dark:text-slate-300">{c.validePar}</strong> ({c.dateValidation})</div>}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-end gap-2 text-xs">
                    <button
                      onClick={() => handleSendSmsCoupure(c)}
                      className="px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold transition flex items-center gap-1 cursor-pointer"
                      title="Envoyer ou réexpédier un SMS d'alerte de coupure imminente"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Alerter par SMS</span>
                    </button>

                    {isPropose && canValidateCoupure && (
                      <button
                        onClick={() => handleValiderCoupure(c.id)}
                        className="bg-rose-600 hover:bg-rose-500 text-white px-3.5 py-1.5 rounded-lg font-bold transition shadow-sm cursor-pointer"
                      >
                        Valider coupure physique
                      </button>
                    )}

                    {isValid && canValidateCoupure && (
                      <button
                        onClick={() => handleRetablir(c.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg font-bold transition shadow-sm flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Rétablir l'eau</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: RELANCES */}
      {activeTab === 'relances' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Historique des Relances Envoyées</h3>
            <span className="text-xs text-slate-400 dark:text-slate-500">{relances.length} messages envoyés</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {relances.map((rel) => (
              <div key={rel.id} className="p-4 flex items-start justify-between gap-4 text-xs">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{rel.abonneNom}</span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{rel.abonneTel}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                      {rel.canal}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/70 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 max-w-xl text-[11px] leading-relaxed">
                    {rel.message}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {rel.montantReclameFCFA.toLocaleString('fr-FR')} FCFA
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{rel.dateRelance}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Proposer Coupure */}
      {showProposerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-[#082F49] dark:text-sky-300 mb-4 flex items-center gap-2">
              <PowerOff className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              Proposition de Suspension de Fourniture d'Eau
            </h3>

            <form onSubmit={handleProposerCoupure} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Abonné redevable *</label>
                <select
                  value={selectedAbonneId}
                  onChange={(e) => setSelectedAbonneId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                >
                  <option value="">-- Choisir un abonné --</option>
                  {abonnes
                    .filter((a) => a.soldeDetteFCFA > 0)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.codeAbonne} - {a.prenom} {a.nom} (Dette: {a.soldeDetteFCFA.toLocaleString('fr-FR')} FCFA)
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Motif formel de la suspension *</label>
                <textarea
                  required
                  rows={3}
                  value={motifCoupure}
                  onChange={(e) => setMotifCoupure(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowProposerModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
                >
                  Soumettre pour validation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SMS Notifications Modal */}
      <SmsNotificationsModal
        isOpen={showSmsModal}
        onClose={() => setShowSmsModal(false)}
        defaultTab="historique"
        preselectedType="COUPURE_IMMINENTE"
      />
    </div>
  );
};
