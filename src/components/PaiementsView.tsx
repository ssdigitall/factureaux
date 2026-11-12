import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  CheckCircle2,
  Clock,
  Printer,
  Smartphone,
  Wallet,
  Building,
  QrCode,
  ShieldCheck,
  Search,
  Receipt,
  AlertCircle,
  Sparkles,
  Camera,
  Check,
  Settings,
  Key,
  Globe,
  Lock,
  X,
} from 'lucide-react';
import { store } from '../services/store';
import { Paiement, ModePaiement, Facture } from '../types';
import {
  payDunyaService,
  PayDunyaCheckoutResponse,
  PayDunyaChannel,
  PAYDUNYA_CHANNELS,
} from '../services/paydunya';
import { QRCameraScannerModal, ScannedResult } from './QRCameraScannerModal';
import { formatFCFA } from '../utils/formatters';

interface PaiementsViewProps {
  initialFactureId?: string;
}

export const PaiementsView: React.FC<PaiementsViewProps> = ({ initialFactureId }) => {
  const [paiements, setPaiements] = useState<Paiement[]>(store.getPaiements());
  const [factures, setFactures] = useState<Facture[]>(store.getFactures());
  const [showAddModal, setShowAddModal] = useState(!!initialFactureId);
  const [selectedReceipt, setSelectedReceipt] = useState<Paiement | null>(null);

  // QR Scanner modal state
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scanNotification, setScanNotification] = useState<{
    type: 'success' | 'warning' | 'info';
    title: string;
    subtitle: string;
  } | null>(null);

  // Form state
  const [selectedFactureId, setSelectedFactureId] = useState(initialFactureId || '');
  const [montant, setMontant] = useState<number>(0);
  const [modePaiement, setModePaiement] = useState<ModePaiement>('WAVE');
  const [refTransaction, setRefTransaction] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // PayDunya Checkout Modal state
  const [payDunyaCheckout, setPayDunyaCheckout] = useState<PayDunyaCheckoutResponse | null>(null);
  const [isProcessingGateway, setIsProcessingGateway] = useState(false);
  const [selectedPayDunyaChannel, setSelectedPayDunyaChannel] = useState<PayDunyaChannel>('WAVE');

  // PayDunya Gateway Config Modal state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [gatewayConfig, setGatewayConfig] = useState(payDunyaService.getConfig());
  const [cfgMasterKey, setCfgMasterKey] = useState(gatewayConfig.masterKey);
  const [cfgPrivateKey, setCfgPrivateKey] = useState(gatewayConfig.privateKey);
  const [cfgTokenKey, setCfgTokenKey] = useState(gatewayConfig.tokenKey);
  const [cfgMode, setCfgMode] = useState<'LIVE' | 'SANDBOX'>(gatewayConfig.mode);
  const [cfgIpnUrl, setCfgIpnUrl] = useState(gatewayConfig.ipnWebhookUrl);
  const [cfgMerchantName, setCfgMerchantName] = useState(gatewayConfig.merchantName);
  const [configSuccessFeedback, setConfigSuccessFeedback] = useState<string | null>(null);

  const currentUser = store.getCurrentUser();
  const currentOrg = store.getCurrentOrganisation();

  const handleScanSuccess = (result: ScannedResult) => {
    setShowQRScanner(false);

    if (result.abonne) {
      if (result.unpaidFactures.length > 0) {
        const facToPay = result.unpaidFactures[0];
        setSelectedFactureId(facToPay.id);
        setMontant(facToPay.resteDuFCFA);
        setShowAddModal(true);
        setErrorMessage(null);

        setScanNotification({
          type: 'success',
          title: `Carte reconnue : ${result.abonne.prenom} ${result.abonne.nom} (${result.abonne.codeAbonne})`,
          subtitle: `Facture ${facToPay.numeroFacture} sélectionnée — Reste dû : ${facToPay.resteDuFCFA.toLocaleString('fr-FR')} FCFA.`,
        });
      } else {
        setScanNotification({
          type: 'info',
          title: `Carte vérifiée : ${result.abonne.prenom} ${result.abonne.nom}`,
          subtitle: "Cet abonné n'a aucune facture impayée actuellement. Solde à jour !",
        });
      }
    } else if (result.facture) {
      setSelectedFactureId(result.facture.id);
      setMontant(result.facture.resteDuFCFA);
      setShowAddModal(true);
      setErrorMessage(null);

      setScanNotification({
        type: 'success',
        title: `Facture reconnue : ${result.facture.numeroFacture}`,
        subtitle: `Abonné : ${result.facture.abonneNom} — Reste à encaisser : ${result.facture.resteDuFCFA.toLocaleString('fr-FR')} FCFA.`,
      });
    } else {
      setScanNotification({
        type: 'warning',
        title: 'Code QR non associé',
        subtitle: `Le code lu ("${result.rawText.slice(0, 30)}") ne correspond à aucun abonné ou facture répertorié.`,
      });
    }

    // Auto dismiss notification after 8s
    setTimeout(() => {
      setScanNotification((prev) => (prev ? null : prev));
    }, 8000);
  };

  React.useEffect(() => {
    return store.subscribe(() => {
      setPaiements(store.getPaiements());
      setFactures(store.getFactures());
    });
  }, []);

  React.useEffect(() => {
    if (initialFactureId) {
      setSelectedFactureId(initialFactureId);
      const fac = factures.find((f) => f.id === initialFactureId);
      if (fac) {
        setMontant(fac.resteDuFCFA);
      }
      setShowAddModal(true);
    }
  }, [initialFactureId, factures]);

  const unpaidFactures = factures.filter((f) => f.resteDuFCFA > 0);
  const selectedFacture = factures.find((f) => f.id === selectedFactureId);

  const handleSelectFactureChange = (id: string) => {
    setSelectedFactureId(id);
    const fac = factures.find((f) => f.id === id);
    if (fac) {
      setMontant(fac.resteDuFCFA);
    }
  };

  const handleEncaisser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacture) {
      setErrorMessage('Veuillez sélectionner une facture à régler.');
      return;
    }

    if (montant <= 0) {
      setErrorMessage('Le montant doit être supérieur à zéro.');
      return;
    }

    if (montant > selectedFacture.resteDuFCFA) {
      setErrorMessage(`Le montant dépasse le reste dû (${selectedFacture.resteDuFCFA.toLocaleString('fr-FR')} FCFA).`);
      return;
    }

    // Si paiement électronique PayDunya / Wave / OM, ouvrir la passerelle sécurisée
    if (modePaiement === 'PAYDUNYA' || modePaiement === 'WAVE' || modePaiement === 'ORANGE_MONEY') {
      setIsProcessingGateway(true);
      const checkout = await payDunyaService.createInvoiceCheckout({
        invoiceId: selectedFacture.id,
        invoiceNumber: selectedFacture.numeroFacture,
        amountFCFA: montant,
        customerName: selectedFacture.abonneNom,
        customerPhone: selectedFacture.abonneTel,
      });
      setPayDunyaCheckout(checkout);
      setIsProcessingGateway(false);
      return;
    }

    // Sinon encaissement direct en Espèces ou Virement
    const res = store.encaisserPaiement({
      factureId: selectedFacture.id,
      montantFCFA: Number(montant),
      modePaiement,
      referenceTransaction: refTransaction || `REF-MANUEL-${Date.now().toString().slice(-6)}`,
    });

    if (!res.success) {
      setErrorMessage(res.message);
      return;
    }

    setShowAddModal(false);
    setErrorMessage(null);
    if (res.paiement) {
      setSelectedReceipt(res.paiement);
    }
  };

  // Simuler la validation sécurisée du Webhook PayDunya / Mobile Money
  const handleConfirmPayDunyaWebhook = () => {
    if (!selectedFacture || !payDunyaCheckout) return;

    const res = store.encaisserPaiement({
      factureId: selectedFacture.id,
      montantFCFA: Number(montant),
      modePaiement,
      referenceTransaction: payDunyaCheckout.token,
    });

    setPayDunyaCheckout(null);
    setShowAddModal(false);
    if (res.paiement) {
      setSelectedReceipt(res.paiement);
    }
  };

  const handleSwitchChannel = async (ch: PayDunyaChannel) => {
    if (!selectedFacture) return;
    setSelectedPayDunyaChannel(ch);
    const checkout = await payDunyaService.createInvoiceCheckout({
      invoiceId: selectedFacture.id,
      invoiceNumber: selectedFacture.numeroFacture,
      amountFCFA: montant,
      customerName: selectedFacture.abonneNom,
      customerPhone: selectedFacture.abonneTel,
      channel: ch,
    });
    setPayDunyaCheckout(checkout);
  };

  const handleSavePayDunyaConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = payDunyaService.updateConfig({
      masterKey: cfgMasterKey,
      privateKey: cfgPrivateKey,
      tokenKey: cfgTokenKey,
      mode: cfgMode,
      ipnWebhookUrl: cfgIpnUrl,
      merchantName: cfgMerchantName,
    });
    setGatewayConfig(updated);
    store.logAudit(
      'CONFIG_PASSERELLE_PAYDUNYA',
      'Paiements/PayDunya',
      'cfg-pd-' + Date.now(),
      `Paramètres PayDunya mis à jour : Mode=${cfgMode}, Marchand=${cfgMerchantName}, IPN=${cfgIpnUrl}`
    );
    setConfigSuccessFeedback('Configuration PayDunya mise à jour avec succès.');
    setTimeout(() => {
      setConfigSuccessFeedback(null);
      setShowConfigModal(false);
    }, 1200);
  };

  const canPay = store.canWriteFinancial();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#082F49] dark:text-cyan-300 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Encaissements & Paiements Électroniques
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Intégration PayDunya, Wave, Orange Money et émission de reçus de caisse certifiés.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canPay && (
            <>
              <button
                onClick={() => setShowConfigModal(true)}
                className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Configurer les clés d'API et le Webhook PayDunya"
              >
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span>Passerelle PayDunya</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                    gatewayConfig.mode === 'LIVE'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {gatewayConfig.mode}
                </span>
              </button>

              <button
                onClick={() => setShowQRScanner(true)}
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Scanner la carte d'abonné ou le QR code de facture avec la caméra"
              >
                <Camera className="w-4 h-4 text-cyan-200" />
                <span>Scanner Carte / QR Code</span>
              </button>

              <button
                onClick={() => {
                  if (unpaidFactures.length > 0) {
                    handleSelectFactureChange(unpaidFactures[0].id);
                  }
                  setShowAddModal(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Encaisser un paiement</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* QR Scan Result Toast Banner */}
      {scanNotification && (
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border text-xs flex items-start justify-between gap-3 shadow-md transition ${
            scanNotification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
              : scanNotification.type === 'warning'
              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-100'
              : 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-300 dark:border-cyan-800 text-cyan-900 dark:text-cyan-100'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {scanNotification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : scanNotification.type === 'warning' ? (
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <QrCode className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-extrabold text-sm">{scanNotification.title}</div>
              <div className="text-xs opacity-90 mt-0.5">{scanNotification.subtitle}</div>
            </div>
          </div>
          <button
            onClick={() => setScanNotification(null)}
            className="text-xs font-bold opacity-60 hover:opacity-100 p-1 rounded-lg cursor-pointer"
            title="Masquer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Paiements Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">N° Reçu</th>
                <th className="py-3 px-4">Date & Heure</th>
                <th className="py-3 px-4">Facture Réf.</th>
                <th className="py-3 px-4">Abonné</th>
                <th className="py-3 px-4">Mode de Paiement</th>
                <th className="py-3 px-4">Montant Réglé</th>
                <th className="py-3 px-4">Réf. Transaction</th>
                <th className="py-3 px-4">Encaissé par</th>
                <th className="py-3 px-4 text-right">Reçu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {paiements.map((p) => {
                const isWave = p.modePaiement === 'WAVE';
                const isOM = p.modePaiement === 'ORANGE_MONEY';
                const isPayDunya = p.modePaiement === 'PAYDUNYA';

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-800 dark:text-cyan-300">
                      {p.recuNumero}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                      {p.datePaiement}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {p.numeroFacture}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {p.abonneNom}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isWave
                            ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800'
                            : isOM
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                            : isPayDunya
                            ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                        }`}
                      >
                        {p.modePaiement}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                      {formatFCFA(p.montantFCFA)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                      {p.referenceTransaction}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      {p.encaisseParNom}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedReceipt(p)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                        title="Voir et imprimer le reçu officiel"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Encaisser */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-[#082F49] dark:text-cyan-300 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Encaisser un Paiement d'Eau
            </h3>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleEncaisser} className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-600 dark:text-slate-300 font-medium">
                    Sélectionner la facture impayée
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowQRScanner(true)}
                    className="text-cyan-600 dark:text-cyan-400 font-bold hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Scanner la carte avec la caméra</span>
                  </button>
                </div>
                <select
                  value={selectedFactureId}
                  onChange={(e) => handleSelectFactureChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="">-- Choisir une facture --</option>
                  {unpaidFactures.map((fac) => (
                    <option key={fac.id} value={fac.id}>
                      {fac.numeroFacture} • {fac.abonneNom} • Reste dû: {fac.resteDuFCFA.toLocaleString('fr-FR')} FCFA
                    </option>
                  ))}
                </select>
              </div>

              {selectedFacture && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border-2 border-slate-200 dark:border-slate-600 space-y-1">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Abonné :</span>
                    <strong className="text-slate-900 dark:text-white">{selectedFacture.abonneNom} ({selectedFacture.abonneCode})</strong>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Période :</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedFacture.periode}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Total Facture :</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">{selectedFacture.totalTTCFCFA.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <div className="flex justify-between text-slate-900 dark:text-white font-bold border-t border-slate-200 dark:border-slate-700 pt-1">
                    <span>Reste à recouvrer :</span>
                    <span className="text-amber-600 dark:text-amber-400 font-mono text-base font-extrabold">
                      {selectedFacture.resteDuFCFA.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1">Montant à encaisser (FCFA) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={selectedFacture?.resteDuFCFA || 999999}
                    value={montant}
                    onChange={(e) => setMontant(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border-2 border-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-base font-extrabold focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                    Paiement partiel ou complet autorisé
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1">Canal de paiement *</label>
                  <select
                    value={modePaiement}
                    onChange={(e) => setModePaiement(e.target.value as ModePaiement)}
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="WAVE">Wave (Scan QR / Mobile)</option>
                    <option value="ORANGE_MONEY">Orange Money (OM USSD)</option>
                    <option value="PAYDUNYA">PayDunya Passerelle</option>
                    <option value="ESPECES">Espèces (Guichet)</option>
                    <option value="VIREMENT_BANCAIRE">Virement Bancaire</option>
                  </select>
                </div>
              </div>

              {['ESPECES', 'VIREMENT_BANCAIRE'].includes(modePaiement) && (
                <div>
                  <label className="block text-slate-600 dark:text-slate-200 font-medium mb-1">
                    Référence de transaction / Quittance guichet
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: QUITT-2026-ESP-01"
                    value={refTransaction}
                    onChange={(e) => setRefTransaction(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              )}

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
                  disabled={isProcessingGateway}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {modePaiement === 'WAVE' || modePaiement === 'ORANGE_MONEY' || modePaiement === 'PAYDUNYA'
                      ? 'Lancer le paiement sécurisé'
                      : 'Valider l encaissement'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PayDunya Multi-Channel Gateway Modal */}
      {payDunyaCheckout && selectedFacture && (
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
                    PASSERELLE PAYDUNYA SÉNÉGAL
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500">
                    Agréé Banque Centrale (BCEAO) • {gatewayConfig.mode === 'LIVE' ? 'Mode Production' : 'Mode Sandbox'}
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                Session Sécurisée
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-left">
              Règlement pour la facture <strong className="text-slate-700 dark:text-slate-200">{selectedFacture.numeroFacture}</strong> ({selectedFacture.abonneNom})
            </p>

            <div className="my-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
              <div className="text-xs text-slate-500 dark:text-slate-400">Montant net à encaisser :</div>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                {formatFCFA(montant)}
              </div>
              <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-1">
                Token PayDunya : {payDunyaCheckout.token}
              </div>
            </div>

            {/* Channels Switcher */}
            <div className="mb-4">
              <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-2 text-left">
                Canal de règlement PayDunya :
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

            {/* QR Code and specific channel guidance */}
            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 mb-4 flex flex-col items-center">
              <div className="w-36 h-36 bg-white p-1 rounded-xl border border-slate-200 shadow-xs flex items-center justify-center">
                <img
                  src={payDunyaCheckout.qrCodeUrl}
                  alt="QR Code Passerelle"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-300 mt-2 text-center max-w-sm">
                {selectedPayDunyaChannel === 'WAVE' && (
                  <p className="text-sky-700 dark:text-sky-300 font-medium">
                    Ouvrez l'application <strong>Wave</strong> sur votre mobile et scannez le QR Code ci-dessus pour confirmer le paiement.
                  </p>
                )}
                {selectedPayDunyaChannel === 'ORANGE_MONEY' && (
                  <p className="text-amber-700 dark:text-amber-300 font-medium">
                    Composez <strong>{payDunyaCheckout.orangeMoneyUssdCode}</strong> ou confirmez la notification push OM reçue sur le téléphone de l'abonné.
                  </p>
                )}
                {selectedPayDunyaChannel === 'FREE_MONEY' && (
                  <p className="text-emerald-700 dark:text-emerald-300 font-medium">
                    Composez <strong>{payDunyaCheckout.freeMoneyUssdCode}</strong> sur votre carte SIM Free Sénégal pour valider l'opération.
                  </p>
                )}
                {selectedPayDunyaChannel === 'CARTE_BANCAIRE' && (
                  <p className="text-indigo-700 dark:text-indigo-300 font-medium">
                    Passerelle 3D-Secure certifiée PCI-DSS. Débit par carte Visa ou Mastercard avec validation OTP bancaire.
                  </p>
                )}
                {selectedPayDunyaChannel === 'PAYDUNYA_WALLET' && (
                  <p className="text-teal-700 dark:text-teal-300 font-medium">
                    Débit direct du compte PayDunya de l'abonné ({payDunyaCheckout.customerPhone}).
                  </p>
                )}
                <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                  Validation instantanée par Webhook sécurisé avec signature HMAC SHA-512 anti-fraude.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPayDunyaCheckout(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs cursor-pointer"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleConfirmPayDunyaWebhook}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simuler réception Webhook IPN PayDunya</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PayDunya Gateway Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Configuration de la Passerelle PayDunya
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Paramètres de sécurité, clés cryptographiques et Webhook IPN
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {configSuccessFeedback && (
              <div className="my-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-800 dark:text-emerald-200 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{configSuccessFeedback}</span>
              </div>
            )}

            <form onSubmit={handleSavePayDunyaConfig} className="space-y-4 mt-4">
              {/* Environnement Mode */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Environnement PayDunya *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCfgMode('LIVE')}
                    className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      cfgMode === 'LIVE'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-400/30'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Mode Production (LIVE)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCfgMode('SANDBOX')}
                    className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      cfgMode === 'SANDBOX'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 ring-2 ring-amber-400/30'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>Mode Test (SANDBOX)</span>
                  </button>
                </div>
              </div>

              {/* Merchant Name */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Nom du compte Marchand PayDunya
                </label>
                <input
                  type="text"
                  required
                  value={cfgMerchantName}
                  onChange={(e) => setCfgMerchantName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Master Key */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Master Key PayDunya</span>
                </label>
                <input
                  type="password"
                  required
                  value={cfgMasterKey}
                  onChange={(e) => setCfgMasterKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Private Key */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Private Key PayDunya</span>
                </label>
                <input
                  type="password"
                  required
                  value={cfgPrivateKey}
                  onChange={(e) => setCfgPrivateKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Token Key */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Token Public PayDunya
                </label>
                <input
                  type="text"
                  required
                  value={cfgTokenKey}
                  onChange={(e) => setCfgTokenKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Webhook IPN Endpoint */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-600" />
                  <span>URL Webhook IPN (Notification instantanée de paiement)</span>
                </label>
                <input
                  type="url"
                  required
                  value={cfgIpnUrl}
                  onChange={(e) => setCfgIpnUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Les requêtes entrantes sont authentifiées par calcul HMAC SHA-512 avec la Master Key.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer transition shadow-sm"
                >
                  Enregistrer les paramètres PayDunya
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div>
                <div className="font-extrabold text-[#082F49] dark:text-cyan-300 text-base">FACTUREAU</div>
                <div className="text-slate-600 dark:text-slate-300 text-[11px] font-semibold">{currentOrg?.nom}</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500">Service de distribution d'eau potable</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-bold">
                  REÇU OFFICIEL DE PAIEMENT
                </span>
                <div className="font-mono font-bold text-sm text-slate-800 dark:text-slate-200 mt-1">
                  {selectedReceipt.recuNumero}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500">{selectedReceipt.datePaiement}</div>
              </div>
            </div>

            <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Abonné :</span>
                <strong className="text-slate-900 dark:text-slate-100">{selectedReceipt.abonneNom}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Facture réglée :</span>
                <span className="font-mono text-sky-800 dark:text-cyan-300 font-bold">{selectedReceipt.numeroFacture}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Mode de paiement :</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedReceipt.modePaiement}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Réf. Transaction :</span>
                <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400">{selectedReceipt.referenceTransaction}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                <span>Montant perçu :</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono font-extrabold">
                  {formatFCFA(selectedReceipt.montantFCFA)}
                </span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 dark:text-slate-500 italic text-center mb-4">
              Paiement irrévocable certifié conforme • Encaissé par {selectedReceipt.encaisseParNom}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
              >
                Fermer
              </button>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-lg bg-[#082F49] hover:bg-sky-900 text-white font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-cyan-400" />
                <span>Imprimer le reçu (Ticket de caisse)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera QR Code Scanner Modal */}
      <QRCameraScannerModal
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
};
