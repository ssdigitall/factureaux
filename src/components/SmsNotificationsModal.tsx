import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Settings,
  Phone,
  User,
  Zap,
  Sparkles,
  ShieldAlert,
  CreditCard,
  Plus,
  Layers,
  Copy,
  Check,
} from 'lucide-react';
import { smsService } from '../services/smsService';
import { store } from '../services/store';
import { toast } from '../services/toastService';
import { SmsNotification, SmsGatewayConfig, Abonne, Facture } from '../types';

interface SmsNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'historique' | 'envoi' | 'configuration';
  preselectedAbonneId?: string;
  preselectedType?: SmsNotification['type'];
}

export const SmsNotificationsModal: React.FC<SmsNotificationsModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'historique',
  preselectedAbonneId,
  preselectedType,
}) => {
  const [activeTab, setActiveTab] = useState<'historique' | 'envoi' | 'configuration'>(defaultTab);
  const [notifications, setNotifications] = useState<SmsNotification[]>(smsService.getNotifications());
  const [config, setConfig] = useState<SmsGatewayConfig>(smsService.getConfig());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form direct SMS
  const abonnes = store.getAbonnes();
  const factures = store.getFactures();
  const currentOrg = store.getCurrentOrganisation();

  const [destinataireAbonneId, setDestinataireAbonneId] = useState(preselectedAbonneId || abonnes[0]?.id || '');
  const [customTel, setCustomTel] = useState(abonnes[0]?.telephone || '');
  const [customNom, setCustomNom] = useState(abonnes[0] ? `${abonnes[0].prenom} ${abonnes[0].nom}` : '');
  const [smsType, setSmsType] = useState<SmsNotification['type']>(preselectedType || 'NOUVELLE_FACTURE');
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Filter state for history
  const [historyFilterType, setHistoryFilterType] = useState<string>('ALL');
  const [historySearch, setHistorySearch] = useState<string>('');

  useEffect(() => {
    return smsService.subscribe((nots, cfg) => {
      setNotifications([...nots]);
      setConfig({ ...cfg });
    });
  }, []);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
    if (preselectedAbonneId) {
      setDestinataireAbonneId(preselectedAbonneId);
      const abn = abonnes.find((a) => a.id === preselectedAbonneId);
      if (abn) {
        setCustomNom(`${abn.prenom} ${abn.nom}`);
        setCustomTel(abn.telephone);
      }
    }
    if (preselectedType) {
      setSmsType(preselectedType);
    }
  }, [defaultTab, preselectedAbonneId, preselectedType, abonnes]);

  // Update default message when type or recipient changes
  useEffect(() => {
    const abn = abonnes.find((a) => a.id === destinataireAbonneId);
    const org = currentOrg?.nom || 'ASUFOR';
    if (!abn) return;

    if (smsType === 'NOUVELLE_FACTURE') {
      const fac = factures.find((f) => f.abonneId === abn.id && f.resteDuFCFA > 0);
      const num = fac ? fac.numeroFacture : 'FACT-202610-0001';
      const montant = fac ? fac.resteDuFCFA : 7500;
      const conso = fac ? fac.consommationM3 : 20;
      setCustomMessage(
        `FACTUREAU [${org}]: Bonjour ${abn.prenom} ${abn.nom}, votre facture d'eau (N° ${num}) est émise. Conso: ${conso} m³. Montant: ${montant.toLocaleString('fr-FR')} FCFA. Réglez facilement par Wave ou OM.`
      );
    } else if (smsType === 'COUPURE_IMMINENTE') {
      const montant = abn.soldeDetteFCFA > 0 ? abn.soldeDetteFCFA : 15000;
      setCustomMessage(
        `FACTUREAU URGENT [${org}]: ${abn.prenom} ${abn.nom} (${abn.codeAbonne}), votre fourniture d'eau potable sera suspendue sous ${config.delaiPreavisHeures}h pour impayé de ${montant.toLocaleString('fr-FR')} FCFA. Merci de régulariser d'urgence pour éviter la coupure.`
      );
    } else if (smsType === 'CONFIRMATION_PAIEMENT') {
      setCustomMessage(
        `FACTUREAU [${org}]: Paiement bien reçu pour votre facture d'eau. Quittance certifiée délivrée. Votre solde est à jour. Merci pour votre ponctualité !`
      );
    } else {
      setCustomMessage(
        `FACTUREAU [${org}]: Bonjour ${abn.prenom} ${abn.nom}, rappel d'information concernant votre branchement au forage ${org}.`
      );
    }
  }, [smsType, destinataireAbonneId, abonnes, factures, currentOrg, config.delaiPreavisHeures]);

  const handleSelectAbonne = (abnId: string) => {
    setDestinataireAbonneId(abnId);
    const abn = abonnes.find((a) => a.id === abnId);
    if (abn) {
      setCustomNom(`${abn.prenom} ${abn.nom}`);
      setCustomTel(abn.telephone);
    }
  };

  const handleSendCustomSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMessage.trim() || !customTel.trim()) {
      toast.error('Veuillez renseigner le numéro de téléphone et le message.');
      return;
    }

    if (config.soldeCreditsSMS <= 0) {
      toast.warning('Solde de crédits SMS épuisé. Veuillez recharger votre compte SMS.');
      setShowRechargeModal(true);
      return;
    }

    setIsSending(true);
    try {
      await smsService.envoyerSmsPersonnalise({
        telephone: customTel,
        destinataireNom: customNom,
        message: customMessage,
        type: smsType,
        abonneId: destinataireAbonneId,
      });

      toast.success(`SMS envoyé avec succès à ${customNom} (${customTel}) !`);
      setActiveTab('historique');
    } catch {
      toast.error("Erreur lors de l'envoi du SMS.");
    } finally {
      setIsSending(false);
    }
  };

  const handleResend = async (id: string) => {
    if (config.soldeCreditsSMS <= 0) {
      toast.warning('Solde de crédits SMS insuffisant pour le renvoi.');
      setShowRechargeModal(true);
      return;
    }
    const res = await smsService.renvoyerSms(id);
    if (res) {
      setSuccessToast(`SMS renvoyé avec succès à ${res.destinataireNom} !`);
      setTimeout(() => setSuccessToast(null), 4000);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRecharge = (credits: number) => {
    smsService.rechargerCredits(credits);
    setShowRechargeModal(false);
    setSuccessToast(`Compte rechargé de +${credits} crédits SMS avec succès !`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const filteredHistory = notifications.filter((n) => {
    const matchesType = historyFilterType === 'ALL' || n.type === historyFilterType;
    const matchesSearch =
      n.destinataireNom.toLowerCase().includes(historySearch.toLowerCase()) ||
      n.destinataireTel.includes(historySearch) ||
      n.message.toLowerCase().includes(historySearch.toLowerCase());
    return matchesType && matchesSearch;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-[#082F49] dark:text-cyan-300 text-base">
                  Service de Notifications SMS Automatiques
                </h3>
                <span className="bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Passerelle Active (Orange SN)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Information instantanée des abonnés par SMS pour nouvelles factures et préavis de coupures
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-4 bg-slate-100/60 dark:bg-slate-950/40 border-b border-slate-200/80 dark:border-slate-800 text-xs">
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Crédits SMS</span>
              <strong className="text-sm font-mono text-cyan-600 dark:text-cyan-400">
                {config.soldeCreditsSMS} SMS
              </strong>
            </div>
            <button
              onClick={() => setShowRechargeModal(true)}
              className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 font-bold transition cursor-pointer"
              title="Recharger des crédits SMS"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Délivrabilité Réseau</span>
            <strong className="text-sm font-mono text-emerald-600 dark:text-emerald-400">99.4%</strong>
          </div>

          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Expéditeur (Sender ID)</span>
            <strong className="text-xs font-mono text-slate-800 dark:text-slate-200 truncate block">
              {config.senderId}
            </strong>
          </div>

          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Délai Préavis Coupure</span>
            <strong className="text-sm font-mono text-amber-600 dark:text-amber-400">
              {config.delaiPreavisHeures}h
            </strong>
          </div>
        </div>

        {/* Success toast banner */}
        {successToast && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{successToast}</span>
            </div>
            <button
              onClick={() => setSuccessToast(null)}
              className="text-xs opacity-60 hover:opacity-100 p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 pt-2 gap-2 bg-slate-50/50 dark:bg-slate-800/20 text-xs">
          <button
            onClick={() => setActiveTab('historique')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'historique'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Historique des Envois ({notifications.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('envoi')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'envoi'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Envoyer un SMS Direct</span>
          </button>

          <button
            onClick={() => setActiveTab('configuration')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'configuration'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Automatisation & Passerelle</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto">
          {/* TAB 1: HISTORIQUE */}
          {activeTab === 'historique' && (
            <div className="space-y-3.5">
              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs">
                <input
                  type="text"
                  placeholder="Rechercher par destinataire, téléphone, contenu du SMS..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 flex-1 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />

                <select
                  value={historyFilterType}
                  onChange={(e) => setHistoryFilterType(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="ALL">Tous les types de notifications</option>
                  <option value="NOUVELLE_FACTURE">Factures Émises</option>
                  <option value="COUPURE_IMMINENTE">Préavis de Coupure</option>
                  <option value="CONFIRMATION_PAIEMENT">Reçus de Paiement</option>
                  <option value="RELANCE_IMPAYE">Relances Libres</option>
                </select>
              </div>

              {/* List */}
              <div className="space-y-2.5">
                {filteredHistory.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                    Aucun SMS ne correspond à vos filtres.
                  </div>
                ) : (
                  filteredHistory.map((item) => {
                    const isCoupure = item.type === 'COUPURE_IMMINENTE';
                    const isFacture = item.type === 'NOUVELLE_FACTURE';
                    const isPay = item.type === 'CONFIRMATION_PAIEMENT';

                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 transition text-xs space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                isCoupure
                                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                                  : isFacture
                                  ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800'
                                  : isPay
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                              }`}
                            >
                              {isCoupure
                                ? '⚠️ COUPURE IMMINENTE'
                                : isFacture
                                ? '💧 NOUVELLE FACTURE'
                                : isPay
                                ? '✓ REÇU PAIEMENT'
                                : 'RELANCE'}
                            </span>

                            <strong className="text-slate-900 dark:text-slate-100 font-semibold">
                              {item.destinataireNom}
                            </strong>
                            <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                              {item.destinataireTel}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                              {item.dateEnvoi}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                              ✓ Délivré (12 FCFA)
                            </span>
                          </div>
                        </div>

                        {/* Message body */}
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-sans text-xs leading-relaxed">
                          {item.message}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between text-[11px] pt-0.5 text-slate-400">
                          <span className="font-mono text-[10px]">Réf : {item.referencePasserelle}</span>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopyMessage(item.id, item.message)}
                              className="text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 font-medium flex items-center gap-1 cursor-pointer"
                              title="Copier le texte"
                            >
                              {copiedId === item.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-500" />
                                  <span className="text-emerald-500">Copié</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copier</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleResend(item.id)}
                              className="text-cyan-600 dark:text-cyan-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                              title="Renvoyer ce SMS"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Renvoyer</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ENVOI DIRECT */}
          {activeTab === 'envoi' && (
            <form onSubmit={handleSendCustomSms} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Sélectionner un abonné
                  </label>
                  <select
                    value={destinataireAbonneId}
                    onChange={(e) => handleSelectAbonne(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                  >
                    {abonnes.map((abn) => (
                      <option key={abn.id} value={abn.id}>
                        {abn.codeAbonne} • {abn.prenom} {abn.nom} ({abn.telephone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Type de message & Modèle
                  </label>
                  <select
                    value={smsType}
                    onChange={(e) => setSmsType(e.target.value as SmsNotification['type'])}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                  >
                    <option value="NOUVELLE_FACTURE">💧 Nouvelle facture émise (Standard)</option>
                    <option value="COUPURE_IMMINENTE">⚠️ Préavis de coupure imminente (Urgent)</option>
                    <option value="CONFIRMATION_PAIEMENT">✓ Reçu de confirmation d'encaissement</option>
                    <option value="RELANCE_IMPAYE">📢 Information / Relance personnalisée</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                    Nom du destinataire
                  </label>
                  <input
                    type="text"
                    required
                    value={customNom}
                    onChange={(e) => setCustomNom(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                    Numéro mobile (format Sénégal / +221)
                  </label>
                  <input
                    type="text"
                    required
                    value={customTel}
                    onChange={(e) => setCustomTel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 dark:text-slate-300 font-bold">
                    Contenu du message SMS
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {customMessage.length} caractères (1 SMS GSM-7)
                  </span>
                </div>
                <textarea
                  rows={4}
                  required
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-sans"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-[11px] text-cyan-900 dark:text-cyan-200 flex items-center justify-between">
                <span>
                  Expéditeur affiché : <strong>{config.senderId}</strong> • Coût d'envoi : <strong>12 FCFA</strong> (Déduit de votre solde : {config.soldeCreditsSMS} SMS restants)
                </span>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSending ? 'Envoi en cours...' : 'Envoyer le SMS maintenant'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: CONFIGURATION */}
          {activeTab === 'configuration' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="font-extrabold text-[#082F49] dark:text-cyan-300 flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Automatisation des Événements Métier
                </h4>

                <div className="space-y-2.5">
                  <label className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <div>
                      <strong className="text-slate-800 dark:text-slate-200 block">
                        Émission automatique lors d'une nouvelle facture
                      </strong>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Envoie immédiatement un SMS à l'abonné dès que sa facture mensuelle est générée en lot ou à l'unité.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.autoSendNouvelleFacture}
                      onChange={(e) =>
                        smsService.updateConfig({ autoSendNouvelleFacture: e.target.checked })
                      }
                      className="w-4 h-4 text-cyan-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <div>
                      <strong className="text-slate-800 dark:text-slate-200 block text-rose-600 dark:text-rose-400">
                        Alerte SMS urgente préavis de coupure d'eau imminente
                      </strong>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Déclenche un SMS d'alerte officielle à l'abonné lors de la proposition ou validation de coupure de compteur.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.autoSendCoupureImminente}
                      onChange={(e) =>
                        smsService.updateConfig({ autoSendCoupureImminente: e.target.checked })
                      }
                      className="w-4 h-4 text-cyan-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <div>
                      <strong className="text-slate-800 dark:text-slate-200 block">
                        Reçu SMS de confirmation de paiement
                      </strong>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Envoie une quittance SMS instantanée certifiée dès encaissement au guichet ou via Wave / Orange Money.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.autoSendPaiement}
                      onChange={(e) =>
                        smsService.updateConfig({ autoSendPaiement: e.target.checked })
                      }
                      className="w-4 h-4 text-cyan-600 rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Paramètres Gateway */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="font-extrabold text-[#082F49] dark:text-cyan-300 text-sm">
                  Paramètres de la Passerelle Télécom
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                      Fournisseur de Passerelle
                    </label>
                    <select
                      value={config.provider}
                      onChange={(e) =>
                        smsService.updateConfig({
                          provider: e.target.value as SmsGatewayConfig['provider'],
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    >
                      <option value="ORANGE_SENEGAL">Orange SMS API (Sonatel)</option>
                      <option value="INTOUCH">InTouch Sénégal (Wave & SMS)</option>
                      <option value="TWILIO">Twilio International</option>
                      <option value="SIMULATEUR">Simulateur Test Télécom</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                      Nom de l'Expéditeur (Sender ID)
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      value={config.senderId}
                      onChange={(e) => smsService.updateConfig({ senderId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono uppercase"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">Max 11 caractères</span>
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                      Délai de Préavis de Coupure
                    </label>
                    <select
                      value={config.delaiPreavisHeures}
                      onChange={(e) =>
                        smsService.updateConfig({ delaiPreavisHeures: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                    >
                      <option value={24}>24 heures (Urgence)</option>
                      <option value={48}>48 heures (Standard)</option>
                      <option value={72}>72 heures (Tolérance)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span className="font-mono">Passerelle GSM : Connectée</span>
            <span>•</span>
            <span>Solde actuel : <strong className="text-cyan-600 dark:text-cyan-400">{config.soldeCreditsSMS} SMS</strong></span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 dark:bg-slate-700 text-white font-bold hover:bg-slate-700 dark:hover:bg-slate-600 cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>

      {/* Mini Modal Recharge Crédits SMS */}
      {showRechargeModal && (
        <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs">
            <h4 className="font-extrabold text-[#082F49] dark:text-cyan-300 text-sm mb-1 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-cyan-500" />
              Recharger des Crédits SMS
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">
              Sélectionnez un pack de crédits SMS facturé à l'organisation :
            </p>

            <div className="space-y-2 mb-4">
              <button
                onClick={() => handleRecharge(100)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-cyan-500 bg-slate-50 dark:bg-slate-800 flex items-center justify-between cursor-pointer font-medium"
              >
                <span>+ 100 SMS</span>
                <span className="font-mono font-bold text-cyan-600">1 200 FCFA</span>
              </button>
              <button
                onClick={() => handleRecharge(500)}
                className="w-full p-2.5 rounded-xl border-2 border-cyan-500/50 hover:border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/40 flex items-center justify-between cursor-pointer font-bold"
              >
                <span>+ 500 SMS (Recommandé)</span>
                <span className="font-mono text-cyan-600">5 500 FCFA</span>
              </button>
              <button
                onClick={() => handleRecharge(1000)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-cyan-500 bg-slate-50 dark:bg-slate-800 flex items-center justify-between cursor-pointer font-medium"
              >
                <span>+ 1 000 SMS</span>
                <span className="font-mono font-bold text-cyan-600">10 000 FCFA</span>
              </button>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowRechargeModal(false)}
                className="px-4 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer font-semibold"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
