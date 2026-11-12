import React, { useState } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Printer,
  Share2,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  QrCode,
  Download,
  FileDown,
  Eye,
  Building2,
  Phone,
  Layers,
  MessageSquare,
  Smartphone,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { store } from '../services/store';
import { toast } from '../services/toastService';
import { Facture, StatutFacture } from '../types';
import { smsService } from '../services/smsService';
import { SmsNotificationsModal } from './SmsNotificationsModal';
import { formatFCFA } from '../utils/formatters';
import { downloadInvoicePdf } from '../services/invoicePdfService';
import {
  payDunyaService,
  PayDunyaCheckoutResponse,
  PayDunyaChannel,
  PAYDUNYA_CHANNELS,
} from '../services/paydunya';

interface FacturesViewProps {
  onEncaisserPaiement?: (factureId: string) => void;
}

export const FacturesView: React.FC<FacturesViewProps> = ({ onEncaisserPaiement }) => {
  const [factures, setFactures] = useState<Facture[]>(store.getFactures());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatut, setSelectedStatut] = useState<string>('ALL');
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsFeedback, setSmsFeedback] = useState<string | null>(null);
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);
  const [payDunyaFeedback, setPayDunyaFeedback] = useState<string | null>(null);

  // PayDunya state
  const [payDunyaCheckout, setPayDunyaCheckout] = useState<PayDunyaCheckoutResponse | null>(null);
  const [payingFacture, setPayingFacture] = useState<Facture | null>(null);
  const [selectedPayDunyaChannel, setSelectedPayDunyaChannel] = useState<PayDunyaChannel>('WAVE');
  const [isInitiatingPayDunya, setIsInitiatingPayDunya] = useState<boolean>(false);

  const currentUser = store.getCurrentUser();
  const currentOrg = store.getCurrentOrganisation();

  const handleDownloadPdf = (facture: Facture) => {
    try {
      downloadInvoicePdf(facture);
      setDownloadFeedback(
        `Facture ${facture.numeroFacture} (${facture.abonneNom}) téléchargée avec succès en PDF imprimable certifié A4.`
      );
      setTimeout(() => setDownloadFeedback(null), 4500);
    } catch (err) {
      console.error('Erreur lors du téléchargement du PDF :', err);
      setDownloadFeedback('Erreur lors de la génération du document PDF.');
      setTimeout(() => setDownloadFeedback(null), 4000);
    }
  };

  const handleSendSmsForFacture = async (facture: Facture) => {
    try {
      await smsService.envoyerSmsNouvelleFacture(facture, currentOrg?.nom);
      setSmsFeedback(`SMS envoyé avec succès à ${facture.abonneNom} (${facture.abonneTel}) !`);
      setTimeout(() => setSmsFeedback(null), 4000);
    } catch {
      setSmsFeedback("Erreur lors de l'envoi du SMS de rappel.");
      setTimeout(() => setSmsFeedback(null), 4000);
    }
  };

  const handleInitiatePayDunya = async (facture: Facture, channel: PayDunyaChannel = 'WAVE') => {
    setIsInitiatingPayDunya(true);
    setPayingFacture(facture);
    setSelectedPayDunyaChannel(channel);
    try {
      const checkout = await payDunyaService.createInvoiceCheckout({
        invoiceId: facture.id,
        invoiceNumber: facture.numeroFacture,
        amountFCFA: facture.resteDuFCFA,
        customerName: facture.abonneNom,
        customerPhone: facture.abonneTel,
        channel,
      });
      setPayDunyaCheckout(checkout);
    } catch (e) {
      console.error('Erreur checkout PayDunya:', e);
      setPayDunyaFeedback('Impossible de contacter la passerelle PayDunya.');
      setTimeout(() => setPayDunyaFeedback(null), 4000);
    } finally {
      setIsInitiatingPayDunya(false);
    }
  };

  const handleSwitchChannel = async (channel: PayDunyaChannel) => {
    if (!payingFacture) return;
    setSelectedPayDunyaChannel(channel);
    const checkout = await payDunyaService.createInvoiceCheckout({
      invoiceId: payingFacture.id,
      invoiceNumber: payingFacture.numeroFacture,
      amountFCFA: payingFacture.resteDuFCFA,
      customerName: payingFacture.abonneNom,
      customerPhone: payingFacture.abonneTel,
      channel,
    });
    setPayDunyaCheckout(checkout);
  };

  const handleConfirmPayDunyaFromFactures = () => {
    if (!payingFacture || !payDunyaCheckout) return;

    const res = store.encaisserPaiement({
      factureId: payingFacture.id,
      montantFCFA: payingFacture.resteDuFCFA,
      modePaiement: 'PAYDUNYA',
      referenceTransaction: payDunyaCheckout.token,
    });

    if (res.success) {
      setPayDunyaFeedback(
        `Paiement PayDunya validé par Webhook ! Facture ${payingFacture.numeroFacture} réglée (${formatFCFA(payingFacture.resteDuFCFA)}). Reçu N° ${res.paiement?.recuNumero}.`
      );
      setTimeout(() => setPayDunyaFeedback(null), 5000);
    }

    setPayDunyaCheckout(null);
    setPayingFacture(null);

    // Refresh selected facture if open
    if (selectedFacture && selectedFacture.id === payingFacture.id) {
      const updated = store.getFactures().find((f) => f.id === payingFacture.id);
      setSelectedFacture(updated || null);
    }
  };

  React.useEffect(() => {
    return store.subscribe(() => {
      setFactures(store.getFactures());
    });
  }, []);

  const filteredFactures = factures.filter((f) => {
    const matchesSearch =
      f.numeroFacture.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.abonneNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.abonneCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.periode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatut = selectedStatut === 'ALL' || f.statut === selectedStatut;
    return matchesSearch && matchesStatut;
  });

  const handleGenererEnLot = () => {
    const count = store.genererFacturesEnLot();
    if (count === 0) {
      setPayDunyaFeedback('Tous les relevés actuels ont déjà été facturés.');
      setTimeout(() => setPayDunyaFeedback(null), 4000);
    } else {
      const autoSms = smsService.getConfig().autoSendNouvelleFacture;
      setPayDunyaFeedback(
        `Génération réussie : ${count} factures émises en lot.${
          autoSms
            ? ' Les notifications SMS ont été acheminées automatiquement aux abonnés par la passerelle télécom.'
            : ''
        }`
      );
      setTimeout(() => setPayDunyaFeedback(null), 6000);
    }
  };

  const handlePrintFacture = () => {
    window.print();
  };

  const handleShareWhatsApp = (facture: Facture) => {
    const message = encodeURIComponent(
      `*FACTUREAU - ${currentOrg?.nom || 'ASUFOR'}*\n` +
        `Bonjour ${facture.abonneNom},\n` +
        `Voici votre facture d'eau pour la période de *${facture.periode}* :\n` +
        `• N° Facture : *${facture.numeroFacture}*\n` +
        `• Consommation : ${facture.consommationM3} m³ (${facture.ancienIndex} -> ${facture.nouvelIndex})\n` +
        `• Montant Total : *${formatFCFA(facture.totalTTCFCFA)}*\n` +
        `• Reste à payer : *${formatFCFA(facture.resteDuFCFA)}*\n` +
        `• Date d'échéance : ${facture.dateEcheance}\n` +
        `Réglez facilement par Wave ou Orange Money.`
    );
    const telClean = facture.abonneTel.replace(/[^0-9]/g, '');
    try {
      window.open(`https://wa.me/${telClean}?text=${message}`, '_blank', 'noopener,noreferrer');
      toast.info(`Lien WhatsApp ouvert pour ${facture.abonneNom}.`);
    } catch {
      toast.warning('Veuillez autoriser les fenêtres pop-up pour ouvrir WhatsApp.');
    }
  };

  const canGenerate = ['ADMIN_ORG', 'ADMIN_FORAGE', 'TRESORIER'].includes(currentUser.role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#082F49] dark:text-cyan-300 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            Gestion des Factures d'Eau & Quittances
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Émission automatique, calcul des tranches, QR codes et relances WhatsApp directes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSmsModal(true)}
            className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Consulter l'historique et la passerelle SMS"
          >
            <MessageSquare className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>Passerelle SMS</span>
          </button>

          {canGenerate && (
            <button
              onClick={handleGenererEnLot}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Générer les factures en lot</span>
            </button>
          )}
        </div>
      </div>

      {/* SMS Success Toast Banner */}
      {smsFeedback && (
        <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-200 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <span>{smsFeedback}</span>
          </div>
          <button
            onClick={() => setSmsFeedback(null)}
            className="text-xs font-bold opacity-60 hover:opacity-100 p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* PDF Download Success Toast Banner */}
      {downloadFeedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <FileDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium">{downloadFeedback}</span>
          </div>
          <button
            onClick={() => setDownloadFeedback(null)}
            className="text-xs font-bold opacity-60 hover:opacity-100 p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* PayDunya Payment Success Toast Banner */}
      {payDunyaFeedback && (
        <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-200 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <span className="font-medium">{payDunyaFeedback}</span>
          </div>
          <button
            onClick={() => setPayDunyaFeedback(null)}
            className="text-xs font-bold opacity-60 hover:opacity-100 p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par N° facture, nom de l'abonné, code ABN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedStatut}
            onChange={(e) => setSelectedStatut(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="PAYEE">Payée</option>
            <option value="PARTIELLEMENT_PAYEE">Partiellement payée</option>
            <option value="NON_PAYEE">Non payée</option>
            <option value="EN_RETARD">En retard</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">N° Facture</th>
                <th className="py-3 px-4">Abonné</th>
                <th className="py-3 px-4">Période</th>
                <th className="py-3 px-4">Consommation</th>
                <th className="py-3 px-4">Total TTC</th>
                <th className="py-3 px-4">Payé</th>
                <th className="py-3 px-4">Reste Dû</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredFactures.map((facture) => {
                const isPayee = facture.statut === 'PAYEE';
                const isRetard = facture.statut === 'EN_RETARD';
                const isPartiel = facture.statut === 'PARTIELLEMENT_PAYEE';

                return (
                  <tr key={facture.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-800 dark:text-cyan-300">
                      {facture.numeroFacture}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{facture.abonneNom}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{facture.abonneCode}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{facture.periode}</td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className="font-bold text-slate-700 dark:text-slate-200">{facture.consommationM3} m³</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                        ({facture.ancienIndex} &rarr; {facture.nouvelIndex})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">
                      {formatFCFA(facture.totalTTCFCFA)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatFCFA(facture.montantPayeFCFA)}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold">
                      <span className={facture.resteDuFCFA > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}>
                        {formatFCFA(facture.resteDuFCFA)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isPayee
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            : isRetard
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                            : isPartiel
                            ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {facture.statut.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedFacture(facture)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                          title="Aperçu & Détails de la facture"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDownloadPdf(facture)}
                          className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 transition cursor-pointer"
                          title="Télécharger la facture imprimable (PDF A4 officiel)"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleSendSmsForFacture(facture)}
                          className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/40 text-sky-700 dark:text-sky-300 transition cursor-pointer"
                          title="Notifier l'abonné par SMS automatique"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleShareWhatsApp(facture)}
                          className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 transition cursor-pointer"
                          title="Partager par WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>

                        {!isPayee && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleInitiatePayDunya(facture)}
                              className="bg-sky-600 hover:bg-sky-500 text-white px-2 py-1 rounded text-[10px] font-extrabold transition shadow-xs flex items-center gap-1 cursor-pointer"
                              title="Payer en ligne via PayDunya (Wave, Orange Money, Free Money, Carte Bancaire)"
                            >
                              <Smartphone className="w-3 h-3 text-sky-200" />
                              <span>PayDunya</span>
                            </button>

                            {store.canWriteFinancial() && (
                              <button
                                onClick={() => onEncaisserPaiement?.(facture.id)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded text-[10px] font-bold transition shadow-xs flex items-center gap-1 cursor-pointer"
                                title="Encaisser au guichet physique (Espèces, Virement)"
                              >
                                <CreditCard className="w-3 h-3" />
                                <span>Guichet</span>
                              </button>
                            )}
                          </div>
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

      {/* Modal Aperçu & Impression Facture */}
      {selectedFacture && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 print:shadow-none print:border-none print:p-0">
            {/* Header Facture */}
            <div className="flex items-start justify-between pb-6 border-b border-slate-200 dark:border-slate-800 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-[#082F49] dark:bg-cyan-950 text-cyan-400 flex items-center justify-center font-bold">
                    FA
                  </div>
                  <span className="font-extrabold text-base text-[#082F49] dark:text-cyan-300 tracking-tight">FACTUREAU</span>
                </div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {currentOrg?.nom || 'ASUFOR de Touba Toul'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {currentOrg?.commune}, {currentOrg?.region} • Tél: {currentOrg?.contactTel}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded font-bold">
                  FACTURE OFFICIELLE D'EAU
                </span>
                <div className="text-base font-extrabold text-sky-900 dark:text-cyan-300 font-mono mt-1">
                  {selectedFacture.numeroFacture}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Émise le : {selectedFacture.dateEmission}
                </div>
                <div className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                  Échéance : {selectedFacture.dateEcheance}
                </div>
              </div>
            </div>

            {/* Client & Période */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 mb-6 text-xs">
              <div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">Abonné</div>
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                  {selectedFacture.abonneNom}
                </div>
                <div className="text-slate-600 dark:text-slate-300">Code : <span className="font-mono">{selectedFacture.abonneCode}</span></div>
                <div className="text-slate-600 dark:text-slate-300">Quartier : {selectedFacture.abonneQuartier}</div>
                <div className="text-slate-600 dark:text-slate-300">Tél : {selectedFacture.abonneTel}</div>
              </div>

              <div className="border-l border-slate-200 dark:border-slate-700 pl-4">
                <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">Détails Période</div>
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                  {selectedFacture.periode}
                </div>
                <div className="text-slate-600 dark:text-slate-300 mt-1">
                  Ancien index : <strong className="font-mono text-slate-800 dark:text-slate-200">{selectedFacture.ancienIndex} m³</strong>
                </div>
                <div className="text-slate-600 dark:text-slate-300">
                  Nouvel index : <strong className="font-mono text-sky-800 dark:text-cyan-300">{selectedFacture.nouvelIndex} m³</strong>
                </div>
                <div className="text-cyan-800 dark:text-cyan-300 font-bold mt-1">
                  Volume consommé : {selectedFacture.consommationM3} m³
                </div>
              </div>
            </div>

            {/* Invoicing Breakdown Table */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden mb-6 text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Désignation</th>
                    <th className="py-2.5 px-3 text-right">Quantité</th>
                    <th className="py-2.5 px-3 text-right">Prix Unitaire</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  <tr>
                    <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">Consommation d'eau au compteur</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-700 dark:text-slate-300">{selectedFacture.consommationM3} m³</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-700 dark:text-slate-300">{selectedFacture.prixUnitaireFCFA} FCFA</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatFCFA(selectedFacture.montantConsommationFCFA)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">Redevance fixe mensuelle entretien réseau</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-700 dark:text-slate-300">1 mois</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-700 dark:text-slate-300">{selectedFacture.redevanceFixeFCFA} FCFA</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatFCFA(selectedFacture.redevanceFixeFCFA)}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-800/70 font-bold border-t border-slate-200 dark:border-slate-700">
                  <tr>
                    <td colSpan={3} className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">TOTAL À PAYER (TTC) :</td>
                    <td className="py-2.5 px-3 text-right font-mono text-sm text-[#082F49] dark:text-cyan-300">
                      {formatFCFA(selectedFacture.totalTTCFCFA)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="py-2.5 px-3 text-right text-emerald-700 dark:text-emerald-400">Montant déjà réglé :</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-700 dark:text-emerald-400">
                      - {formatFCFA(selectedFacture.montantPayeFCFA)}
                    </td>
                  </tr>
                  <tr className="border-t border-slate-200 dark:border-slate-700">
                    <td colSpan={3} className="py-2.5 px-3 text-right text-base text-slate-900 dark:text-slate-100">RESTE DÛ :</td>
                    <td className="py-2.5 px-3 text-right font-mono text-base font-black text-amber-600 dark:text-amber-400">
                      {formatFCFA(selectedFacture.resteDuFCFA)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Bottom: QR Code & Payment info */}
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 mb-6 text-xs">
              <div className="space-y-1">
                <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  Paiement sécurisé Wave & Orange Money
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Scannez ce QR Code ou mentionnez la référence <strong className="text-slate-700 dark:text-slate-200">{selectedFacture.numeroFacture}</strong> lors de votre paiement.
                </p>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                  Certificat d'intégrité FACTUREAU : {selectedFacture.qrCodeData.substring(0, 32)}...
                </div>
              </div>

              <div className="w-20 h-20 bg-white p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 shrink-0 flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                    selectedFacture.qrCodeData
                  )}`}
                  alt="QR Code Facture"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 no-print">
              <button
                onClick={() => setSelectedFacture(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs cursor-pointer transition text-center"
              >
                Fermer
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleSendSmsForFacture(selectedFacture)}
                  className="px-3.5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition"
                  title="Envoyer un SMS automatique avec montant et délai"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>SMS</span>
                </button>

                <button
                  onClick={() => handleShareWhatsApp(selectedFacture)}
                  className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                {/* PayDunya Action Button */}
                {selectedFacture.statut !== 'PAYEE' && selectedFacture.resteDuFCFA > 0 && (
                  <button
                    onClick={() => handleInitiatePayDunya(selectedFacture)}
                    className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-sky-500/20 cursor-pointer transition ring-2 ring-sky-400/40"
                    title="Régler immédiatement via la passerelle PayDunya (Wave, OM, Free, Carte)"
                  >
                    <Smartphone className="w-4 h-4 text-sky-100" />
                    <span>Payer via PayDunya ({formatFCFA(selectedFacture.resteDuFCFA)})</span>
                  </button>
                )}

                {/* Primary Requested Button */}
                <button
                  onClick={() => handleDownloadPdf(selectedFacture)}
                  className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-cyan-500/20 cursor-pointer transition ring-2 ring-cyan-400/40"
                  title="Télécharger la facture imprimable au format PDF officiel A4 certifié"
                >
                  <FileDown className="w-4 h-4 text-cyan-100" />
                  <span>Télécharger la facture imprimable</span>
                </button>

                <button
                  onClick={handlePrintFacture}
                  className="px-3.5 py-2.5 rounded-xl bg-[#082F49] hover:bg-sky-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition"
                  title="Imprimer directement via la boîte de dialogue système"
                >
                  <Printer className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Imprimer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PayDunya Multi-Channel Checkout Modal */}
      {payDunyaCheckout && payingFacture && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 text-center max-h-[92vh] overflow-y-auto">
            {/* PayDunya Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-sky-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                  PD
                </span>
                <div className="text-left">
                  <div className="text-xs font-black tracking-wide text-sky-700 dark:text-sky-300">
                    PAYDUNYA SÉNÉGAL
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500">
                    Passerelle Agréée • Encaissement Eau Potable
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                Session Sécurisée
              </span>
            </div>

            {/* Bill Summary */}
            <div className="my-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
              <div className="text-xs text-slate-500 dark:text-slate-400">Montant net de la facture :</div>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                {formatFCFA(payDunyaCheckout.amountFCFA)}
              </div>
              <div className="text-xs text-slate-700 dark:text-slate-200 font-semibold mt-1">
                Facture {payDunyaCheckout.invoiceNumber} • {payDunyaCheckout.customerName}
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-1">
                Token PayDunya : {payDunyaCheckout.token}
              </div>
            </div>

            {/* Channel Selection Buttons */}
            <div className="mb-4">
              <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-2 text-left">
                Sélectionnez le mode de règlement électronique :
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PAYDUNYA_CHANNELS.map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => handleSwitchChannel(ch.id)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                      selectedPayDunyaChannel === ch.id
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/50 text-sky-900 dark:text-sky-200 ring-2 ring-sky-400/30 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-lg">{ch.logo}</span>
                    <span className="text-[11px] font-bold truncate max-w-full">{ch.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic QR Code & Channel Guidance */}
            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 mb-4 flex flex-col items-center">
              <div className="w-36 h-36 bg-white p-1 rounded-xl border border-slate-200 shadow-xs flex items-center justify-center">
                <img
                  src={payDunyaCheckout.qrCodeUrl}
                  alt="QR Code PayDunya"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-300 mt-2 text-center max-w-sm">
                {selectedPayDunyaChannel === 'WAVE' && (
                  <p className="text-sky-700 dark:text-sky-300 font-medium">
                    Ouvrez l'application <strong>Wave</strong> pour scanner ce QR Code ou valider le paiement sans frais.
                  </p>
                )}
                {selectedPayDunyaChannel === 'ORANGE_MONEY' && (
                  <p className="text-amber-700 dark:text-amber-300 font-medium">
                    Composez <strong>{payDunyaCheckout.orangeMoneyUssdCode}</strong> ou acceptez le push sur votre téléphone.
                  </p>
                )}
                {selectedPayDunyaChannel === 'FREE_MONEY' && (
                  <p className="text-emerald-700 dark:text-emerald-300 font-medium">
                    Composez <strong>{payDunyaCheckout.freeMoneyUssdCode}</strong> sur votre carte SIM Free Sénégal.
                  </p>
                )}
                {selectedPayDunyaChannel === 'CARTE_BANCAIRE' && (
                  <p className="text-indigo-700 dark:text-indigo-300 font-medium">
                    Session 3D-Secure certifiée. Redirection vers le serveur d'authentification Visa / Mastercard.
                  </p>
                )}
                {selectedPayDunyaChannel === 'PAYDUNYA_WALLET' && (
                  <p className="text-teal-700 dark:text-teal-300 font-medium">
                    Débit direct du compte PayDunya de l'abonné ({payDunyaCheckout.customerPhone}).
                  </p>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setPayDunyaCheckout(null);
                  setPayingFacture(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs cursor-pointer"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleConfirmPayDunyaFromFactures}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simuler réception Webhook IPN PayDunya</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMS Notifications Management Modal */}
      <SmsNotificationsModal
        isOpen={showSmsModal}
        onClose={() => setShowSmsModal(false)}
      />
    </div>
  );
};
