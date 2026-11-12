import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Save,
  RotateCcw,
  Sparkles,
  Zap,
  AlertTriangle,
  Receipt,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Phone,
  Building2,
  Send,
  Plus,
  RefreshCw,
  Check,
  Info,
  HelpCircle,
  BellRing,
  Radio,
  Volume2,
  VolumeX,
  Gauge,
  Waves,
  AlertOctagon,
  Activity,
  SlidersHorizontal,
  X,
  Play,
  CheckCheck,
} from 'lucide-react';
import { smsService, interpolateSmsTemplate, DEFAULT_PUSH_FORAGE_CONFIG } from '../services/smsService';
import { store } from '../services/store';
import { toast } from '../services/toastService';
import { SmsGatewayConfig, SmsNotification, PushNotificationForageConfig, UserRole } from '../types';

interface SmsAlertsConfigViewProps {
  onNavigate?: (module: string) => void;
}

export const SmsAlertsConfigView: React.FC<SmsAlertsConfigViewProps> = ({ onNavigate }) => {
  const [config, setConfig] = useState<SmsGatewayConfig>(smsService.getConfig());
  const [notifications, setNotifications] = useState<SmsNotification[]>(smsService.getNotifications());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);
  const [showRechargeModal, setShowRechargeModal] = useState(false);

  // Push notifications state & simulation
  const [simulatedLevel, setSimulatedLevel] = useState<number>(18);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [pushTestBanner, setPushTestBanner] = useState<{
    titre: string;
    message: string;
    timestamp: string;
    forageNom: string;
    niveau: number;
    statut: 'CRITIQUE' | 'ALERTE' | 'NORMAL';
  } | null>(null);

  const [pushPermission, setPushPermission] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  const currentOrg = store.getCurrentOrganisation();
  const abonnes = store.getAbonnes();
  const factures = store.getFactures();
  const forages = store.getForages();

  const pushConfig: PushNotificationForageConfig =
    config.pushForageConfig || DEFAULT_PUSH_FORAGE_CONFIG;

  // Pick a sample subscriber for live previews
  const sampleAbonne = abonnes[0] || {
    id: 'abn-1',
    prenom: 'Modou',
    nom: 'Gueye',
    codeAbonne: 'ABN-001',
    telephone: '+221 77 123 45 67',
    soldeDetteFCFA: 18000,
  };

  const sampleFacture = factures[0] || {
    numeroFacture: 'FACT-202610-0001',
    periode: 'Mars 2026',
    totalTTCFCFA: 7500,
    consommationM3: 20,
    dateEcheance: '2026-04-15',
  };

  useEffect(() => {
    return smsService.subscribe((nots, cfg) => {
      setNotifications([...nots]);
      setConfig({ ...cfg });
    });
  }, []);

  const handleSaveConfig = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    smsService.updateConfig(config);
    store.logAudit(
      'MODIFICATION_CONFIGURATION',
      'Configuration SMS & Passerelle',
      'cfg-sms',
      `Mise à jour configuration alertes & passerelle : Provider=${config.provider}, SenderID=${config.senderId}, Préavis Coupure=${config.delaiPreavisHeures}h, AutoFacture=${config.autoSendNouvelleFacture ? 'Oui' : 'Non'}, SeuilMin=${config.seuilMinimumFactureFCFA} FCFA, PushNiveauBas=${config.pushForageConfig?.activerPushNiveauBas ? 'Actif' : 'Inactif'}`
    );
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetToDefault = () => {
    if (window.confirm('Réinitialiser la configuration des alertes SMS aux modèles recommandés ?')) {
      const reset = smsService.updateConfig({
        senderId: 'FACTUREAU',
        autoSendNouvelleFacture: true,
        autoSendCoupureImminente: true,
        autoSendPaiement: true,
        delaiPreavisHeures: 48,
        templateNouvelleFacture:
          "{SENDER_ID} [{ORG_NOM}]: Bonjour {ABONNE_NOM}, votre facture d'eau du mois de {PERIODE} (N° {NUMERO_FACTURE}) est émise. Conso: {CONSO_M3} m³. Montant: {MONTANT_FCFA} FCFA à régler avant le {DATE_ECHEANCE}. Paiement Wave/Orange Money accepté.",
        templateCoupureImminente:
          "{SENDER_ID} URGENT [{ORG_NOM}]: {ABONNE_NOM} ({CODE_ABONNE}), votre alimentation en eau potable fera l'objet d'une suspension sous {DELAI_HEURES}h pour un impayé de {MONTANT_FCFA} FCFA. Contactez immédiatement l'administration ({CONTACT_TEL}) ou régularisez par Wave/OM.",
        templateConfirmationPaiement:
          '{SENDER_ID} [{ORG_NOM}]: Reçu N° {NUMERO_RECU}. Paiement de {MONTANT_FCFA} FCFA bien reçu pour la facture {NUMERO_FACTURE}. {MESSAGE_SOLDE} Merci pour votre ponctualité !',
        timingEnvoiFacture: 'IMMEDIAT',
        seuilMinimumFactureFCFA: 500,
        activerRappelUltime: true,
        rappelUltimeHeures: 6,
        contactReclamationTel: '+221 33 971 00 00',
        pushForageConfig: DEFAULT_PUSH_FORAGE_CONFIG,
      });
      setConfig({ ...reset });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const updatePushConfig = (partial: Partial<PushNotificationForageConfig>) => {
    setConfig((prev) => ({
      ...prev,
      pushForageConfig: {
        ...(prev.pushForageConfig || DEFAULT_PUSH_FORAGE_CONFIG),
        ...partial,
      },
    }));
  };

  const toggleRole = (role: UserRole) => {
    const currentRoles = pushConfig.destinatairesRoles || [];
    const nextRoles = currentRoles.includes(role)
      ? currentRoles.filter((r) => r !== role)
      : [...currentRoles, role];
    updatePushConfig({ destinatairesRoles: nextRoles });
  };

  const playAlertTone = () => {
    try {
      setIsPlayingAudio(true);
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        setIsPlayingAudio(false);
        return;
      }
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
      setTimeout(() => setIsPlayingAudio(false), 400);
    } catch {
      setIsPlayingAudio(false);
    }
  };

  const handleRequestPushPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const result = await Notification.requestPermission();
        setPushPermission(result);
        if (result === 'granted') {
          setTestSuccess('Notifications Push système autorisées par votre navigateur avec succès !');
          setTimeout(() => setTestSuccess(null), 4000);
        } else if (result === 'denied') {
          toast.warning("L'autorisation de notifications a été bloquée par le navigateur. Vous pouvez la réactiver dans les paramètres du site.");
        }
      } catch (err) {
        console.warn('Erreur demande permission push:', err);
      }
    } else {
      toast.info("Ce navigateur ne supporte pas l'API standard Web Push.");
    }
  };

  const handleTriggerTestPush = async () => {
    if (pushConfig.sonAlerteActive) {
      playAlertTone();
    }
    if (pushConfig.vibreurMobileActive && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }

    const targetedForage = forages.find((f) => f.id === pushConfig.forageCibleId);
    const forageNom = targetedForage ? targetedForage.nom : 'Forage Touba Toul Centre (F1)';

    const isCritique = simulatedLevel <= pushConfig.seuilCritiqueArretPourcent;
    const isAlerte = simulatedLevel <= pushConfig.seuilAlertePourcent;

    const titre = isCritique
      ? `🚨 DANGER MARCHE À SEC • ${forageNom}`
      : isAlerte
      ? `⚠️ ALERTE NIVEAU BAS • ${forageNom}`
      : `ℹ️ Contrôle Niveau Normal • ${forageNom}`;

    const bodyText = isCritique
      ? `Niveau critique atteint (${simulatedLevel}% restant). Arrêt automatique d'urgence de la pompe requis pour éviter la cavitation !`
      : isAlerte
      ? `Niveau d'eau sous le seuil d'alerte (${simulatedLevel}% restant < ${pushConfig.seuilAlertePourcent}%). Vérifier l'immersion et le rabattement.`
      : `Niveau d'eau satisfaisant (${simulatedLevel}%). Débit de pompage nominal.`;

    let browserNotifSent = false;
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(titre, {
          body: bodyText,
          icon: '/favicon.ico',
          tag: 'alerte-forage-niveau-bas',
        });
        browserNotifSent = true;
      } catch {
        // Handled in preview
      }
    }

    setPushTestBanner({
      titre,
      message: bodyText,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      forageNom,
      niveau: simulatedLevel,
      statut: isCritique ? 'CRITIQUE' : isAlerte ? 'ALERTE' : 'NORMAL',
    });

    setTestSuccess(
      browserNotifSent
        ? `Notification Push système émise sur votre appareil ! (${forageNom} à ${simulatedLevel}%)`
        : `Simulation d'Alerte Push déclenchée (Alerte sonore + Vibreur + Notification interactive à l'écran)`
    );
    setTimeout(() => setTestSuccess(null), 5000);
  };

  const handleInsertTag = (field: 'templateNouvelleFacture' | 'templateCoupureImminente', tag: string) => {
    setConfig((prev) => ({
      ...prev,
      [field]: prev[field] + ' ' + tag,
    }));
  };

  // Preview interpolation
  const previewNouvelleFacture = interpolateSmsTemplate(config.templateNouvelleFacture, {
    SENDER_ID: config.senderId,
    ORG_NOM: currentOrg?.nom || 'ASUFOR NDIOB',
    ABONNE_NOM: `${sampleAbonne.prenom} ${sampleAbonne.nom}`,
    PERIODE: sampleFacture.periode,
    NUMERO_FACTURE: sampleFacture.numeroFacture,
    CONSO_M3: sampleFacture.consommationM3,
    MONTANT_FCFA: sampleFacture.totalTTCFCFA.toLocaleString('fr-FR'),
    DATE_ECHEANCE: sampleFacture.dateEcheance,
  });

  const previewCoupureImminente = interpolateSmsTemplate(config.templateCoupureImminente, {
    SENDER_ID: config.senderId,
    ORG_NOM: currentOrg?.nom || 'ASUFOR NDIOB',
    ABONNE_NOM: `${sampleAbonne.prenom} ${sampleAbonne.nom}`,
    CODE_ABONNE: sampleAbonne.codeAbonne,
    DELAI_HEURES: config.delaiPreavisHeures,
    MONTANT_FCFA: (sampleAbonne.soldeDetteFCFA || 18000).toLocaleString('fr-FR'),
    CONTACT_TEL: config.contactReclamationTel,
  });

  const handleTestFactureSms = async () => {
    if (config.soldeCreditsSMS <= 0) {
      toast.warning('Solde de crédits SMS épuisé. Veuillez recharger votre compte.');
      setShowRechargeModal(true);
      return;
    }
    await smsService.envoyerSmsPersonnalise({
      telephone: sampleAbonne.telephone,
      destinataireNom: `${sampleAbonne.prenom} ${sampleAbonne.nom}`,
      type: 'NOUVELLE_FACTURE',
      message: previewNouvelleFacture,
      abonneId: sampleAbonne.id,
    });
    setTestSuccess(`SMS de test Facture envoyé avec succès à ${sampleAbonne.telephone} !`);
    setTimeout(() => setTestSuccess(null), 4000);
  };

  const handleTestCoupureSms = async () => {
    if (config.soldeCreditsSMS <= 0) {
      toast.warning('Solde de crédits SMS épuisé. Veuillez recharger votre compte.');
      setShowRechargeModal(true);
      return;
    }
    await smsService.envoyerSmsPersonnalise({
      telephone: sampleAbonne.telephone,
      destinataireNom: `${sampleAbonne.prenom} ${sampleAbonne.nom}`,
      type: 'COUPURE_IMMINENTE',
      message: previewCoupureImminente,
      abonneId: sampleAbonne.id,
    });
    setTestSuccess(`SMS de test Coupure envoyé avec succès à ${sampleAbonne.telephone} !`);
    setTimeout(() => setTestSuccess(null), 4000);
  };

  const handleRechargeCredits = (amount: number) => {
    smsService.rechargerCredits(amount);
    setShowRechargeModal(false);
    setTestSuccess(`Recharge de +${amount} crédits SMS effectuée avec succès !`);
    setTimeout(() => setTestSuccess(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-[#082F49] dark:text-cyan-300 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              Module de Configuration des Alertes SMS Automatiques
            </h2>
            <span className="bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Orange SMS API Connectée
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Déclencheurs automatiques pour l'émission des factures d'eau et les avis formels de coupure imminente.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleResetToDefault}
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition"
            title="Rétablir les modèles d'origine"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Réinitialiser</span>
          </button>

          <button
            onClick={() => handleSaveConfig()}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer les paramètres</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 text-xs font-semibold flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Configuration des alertes SMS enregistrée et appliquée immédiatement à la passerelle télécom.</span>
        </div>
      )}

      {testSuccess && (
        <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-100 text-xs font-semibold flex items-center gap-2 shadow-sm animate-fade-in">
          <Send className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
          <span>{testSuccess}</span>
        </div>
      )}

      {/* Floating Push Notification Test Preview Banner */}
      {pushTestBanner && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-100 text-xs shadow-md flex items-start justify-between gap-3 animate-fade-in">
          <div className="flex items-start gap-3">
            <div
              className={`p-2.5 rounded-xl shrink-0 text-white ${
                pushTestBanner.statut === 'CRITIQUE'
                  ? 'bg-rose-600 animate-pulse'
                  : 'bg-amber-500'
              }`}
            >
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold text-sm">{pushTestBanner.titre}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/60 font-bold">
                  {pushTestBanner.timestamp}
                </span>
                <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-bold">
                  {pushTestBanner.forageNom}
                </span>
              </div>
              <p className="mt-1 text-slate-700 dark:text-slate-300 font-medium">
                {pushTestBanner.message}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Niveau mesuré : <strong className="font-mono">{pushTestBanner.niveau}%</strong>
                </span>
                {pushConfig.sonAlerteActive && (
                  <span className="text-[10px] text-cyan-800 dark:text-cyan-200 flex items-center gap-1 bg-cyan-100 dark:bg-cyan-950 px-2 py-0.5 rounded font-semibold">
                    <Volume2 className="w-3 h-3" /> Signal sonore émis
                  </span>
                )}
                {pushConfig.vibreurMobileActive && (
                  <span className="text-[10px] text-cyan-800 dark:text-cyan-200 flex items-center gap-1 bg-cyan-100 dark:bg-cyan-950 px-2 py-0.5 rounded font-semibold">
                    <Activity className="w-3 h-3" /> Vibreur activé
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setPushTestBanner(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Fermer la bannière"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Telecommunication Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium block">Solde Crédits SMS</span>
            <div className="text-2xl font-black font-mono text-cyan-600 dark:text-cyan-400 mt-0.5">
              {config.soldeCreditsSMS} SMS
            </div>
            <span className="text-[10px] text-slate-400">Coût: 12 FCFA / SMS</span>
          </div>
          <button
            onClick={() => setShowRechargeModal(true)}
            className="px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Recharger</span>
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium block">Taux de Délivrabilité</span>
          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
            99.4%
          </div>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">Orange, Free & Expresso SN</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium block">Alertes Push Niveau Bas</span>
          <div className="text-xl font-bold font-mono text-[#082F49] dark:text-cyan-300 mt-1 flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                pushConfig.activerPushNiveauBas ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span>{pushConfig.activerPushNiveauBas ? 'Actives' : 'Inactives'}</span>
          </div>
          <span className="text-[10px] text-slate-400">Seuil d'alerte : &lt; {pushConfig.seuilAlertePourcent}%</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium block">Total SMS Transmis</span>
          <div className="text-2xl font-black font-mono text-sky-700 dark:text-sky-300 mt-0.5">
            {notifications.length} envois
          </div>
          <span className="text-[10px] text-slate-400">Journal certifié avec accusé</span>
        </div>
      </div>

      {/* Main Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 1: ALERTES NOUVELLE FACTURE */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-5">
          <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-[#082F49] dark:text-cyan-300 text-base">
                  1. Alertes SMS « Nouvelle Facture »
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Notification immédiate dès génération du relevé d'eau mensuel
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoSendNouvelleFacture}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, autoSendNouvelleFacture: e.target.checked }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
            </label>
          </div>

          {/* Timing & Conditions */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                Moment d'expédition
              </label>
              <select
                value={config.timingEnvoiFacture}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    timingEnvoiFacture: e.target.value as SmsGatewayConfig['timingEnvoiFacture'],
                  }))
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="IMMEDIAT">Immédiatement à l'émission</option>
                <option value="DIFFERE_24H">Différé de 24h (Heures ouvrées)</option>
                <option value="DEB_MOIS">Au 1er du mois suivant</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                Seuil minimum facture
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={config.seuilMinimumFactureFCFA}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, seuilMinimumFactureFCFA: Number(e.target.value) }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                />
                <span className="absolute right-3 top-2 text-[11px] text-slate-400">FCFA</span>
              </div>
            </div>
          </div>

          {/* Template editor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-slate-700 dark:text-slate-300 font-bold text-xs">
                Modèle de SMS Nouvelle Facture
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {config.templateNouvelleFacture.length} caractères • 1 SMS GSM-7
              </span>
            </div>
            <textarea
              rows={4}
              value={config.templateNouvelleFacture}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, templateNouvelleFacture: e.target.value }))
              }
              className="w-full p-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-cyan-500 font-sans"
            />

            {/* Quick insert tags */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400 font-semibold mr-1">Variables :</span>
              {[
                '{ABONNE_NOM}',
                '{PERIODE}',
                '{NUMERO_FACTURE}',
                '{MONTANT_FCFA}',
                '{DATE_ECHEANCE}',
                '{CONSO_M3}',
                '{ORG_NOM}',
                '{SENDER_ID}',
              ].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleInsertTag('templateNouvelleFacture', tag)}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-mono cursor-pointer transition"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Live Mobile Simulator for Invoice */}
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                <Smartphone className="w-3.5 h-3.5 text-cyan-500" />
                Aperçu SMS reçu sur le mobile de l'abonné
              </span>
              <span className="font-mono text-[10px]">{sampleAbonne.telephone}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 font-sans leading-relaxed">
              <div className="text-[10px] font-bold text-sky-700 dark:text-cyan-400 mb-1 flex items-center justify-between">
                <span>{config.senderId}</span>
                <span className="text-[9px] text-slate-400 font-normal">Aujourd'hui 09:30</span>
              </div>
              {previewNouvelleFacture}
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleTestFactureSms}
                className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Tester l'envoi vers {sampleAbonne.prenom} {sampleAbonne.nom}</span>
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 2: ALERTES COUPURE IMMINENTE */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-5">
          <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-[#082F49] dark:text-cyan-300 text-base">
                  2. Alertes SMS « Coupure Imminente »
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Préavis urgent automatique avant suspension physique de vanne
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoSendCoupureImminente}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, autoSendCoupureImminente: e.target.checked }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
            </label>
          </div>

          {/* Delais & Paramètres Coupure */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                Délai de préavis légal
              </label>
              <select
                value={config.delaiPreavisHeures}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, delaiPreavisHeures: Number(e.target.value) }))
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-rose-700 dark:text-rose-400"
              >
                <option value={24}>24 heures (Urgence absolue)</option>
                <option value={48}>48 heures (Standard recommandé ASUFOR)</option>
                <option value={72}>72 heures (Tolérance sociale)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                Ligne d'assistance / Réclamation
              </label>
              <input
                type="text"
                value={config.contactReclamationTel}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, contactReclamationTel: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
          </div>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 cursor-pointer text-xs">
            <div>
              <strong className="text-slate-900 dark:text-slate-100 block">
                Rappel ultime par SMS ({config.rappelUltimeHeures}h avant suspension)
              </strong>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Envoie une dernière alerte 6h avant le déplacement du technicien pour encourager le règlement Wave/OM.
              </span>
            </div>
            <input
              type="checkbox"
              checked={config.activerRappelUltime}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, activerRappelUltime: e.target.checked }))
              }
              className="w-4 h-4 text-rose-600 rounded cursor-pointer"
            />
          </label>

          {/* Template editor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-slate-700 dark:text-slate-300 font-bold text-xs">
                Modèle de SMS Préavis de Coupure Imminente
              </label>
              <span className="text-[11px] text-rose-600 dark:text-rose-400 font-mono">
                {config.templateCoupureImminente.length} caractères
              </span>
            </div>
            <textarea
              rows={4}
              value={config.templateCoupureImminente}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, templateCoupureImminente: e.target.value }))
              }
              className="w-full p-3 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-rose-500 font-sans"
            />

            {/* Quick insert tags */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400 font-semibold mr-1">Variables :</span>
              {[
                '{ABONNE_NOM}',
                '{CODE_ABONNE}',
                '{DELAI_HEURES}',
                '{MONTANT_FCFA}',
                '{CONTACT_TEL}',
                '{ORG_NOM}',
                '{SENDER_ID}',
              ].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleInsertTag('templateCoupureImminente', tag)}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-mono cursor-pointer transition"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Live Mobile Simulator for Cutoff */}
          <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/60 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                <Smartphone className="w-3.5 h-3.5" />
                Aperçu SMS Urgent reçu sur le mobile
              </span>
              <span className="font-mono text-[10px]">{sampleAbonne.telephone}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-rose-200 dark:border-rose-900/80 text-xs text-slate-800 dark:text-slate-200 font-sans leading-relaxed">
              <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mb-1 flex items-center justify-between">
                <span>{config.senderId} (URGENT)</span>
                <span className="text-[9px] text-slate-400 font-normal">Aujourd'hui 11:15</span>
              </div>
              {previewCoupureImminente}
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleTestCoupureSms}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Tester l'alerte coupure vers {sampleAbonne.prenom} {sampleAbonne.nom}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━ SECTION 3: PRÉFÉRENCES DES NOTIFICATIONS PUSH (ALERTES NIVEAU BAS FORAGE) ━━━━━━━━━━ */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-7 space-y-6">
        {/* Header with Switch */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-50 dark:bg-cyan-950/70 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold shadow-xs">
              <Radio className="w-6 h-6 animate-pulse text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-[#082F49] dark:text-cyan-300 text-base sm:text-lg">
                  3. Préférences des Notifications Push – Alertes Niveau Bas Forage
                </h3>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    pushConfig.activerPushNiveauBas
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {pushConfig.activerPushNiveauBas ? 'SERVICE ACTIF' : 'SUSPENDU'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Surveillance de la nappe phréatique & alertes instantanées push (navigateur & smartphone PWA) pour protéger les pompes contre le désamorçage.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {pushConfig.activerPushNiveauBas ? 'Notifications activées' : 'Notifications désactivées'}
            </span>
            <button
              type="button"
              onClick={() => updatePushConfig({ activerPushNiveauBas: !pushConfig.activerPushNiveauBas })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                pushConfig.activerPushNiveauBas ? 'bg-cyan-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
              role="switch"
              aria-checked={pushConfig.activerPushNiveauBas}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  pushConfig.activerPushNiveauBas ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Browser Push Permission & Quick Test Action Bar */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <BellRing className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200">Statut Web Push Navigateur : </span>
              {pushPermission === 'granted' ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Autorisé & Prêt pour alertes en tâche de fond
                </span>
              ) : pushPermission === 'denied' ? (
                <span className="text-rose-600 dark:text-rose-400 font-semibold inline-flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Bloqué par les préférences de votre navigateur
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 font-semibold inline-flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  Autorisation requise pour recevoir les alertes sur cet appareil
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {pushPermission !== 'granted' && (
              <button
                type="button"
                onClick={handleRequestPushPermission}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Smartphone className="w-3.5 h-3.5 text-cyan-600" />
                <span>Autoriser le navigateur</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleTriggerTestPush}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Émettre une alerte de test avec son, vibreur et notification"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Tester l'alerte Push en direct</span>
            </button>
          </div>
        </div>

        {/* Two Columns: Left = Interactive Visual Gauge & Simulator, Right = Thresholds & Parameters */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: INTERACTIVE TANK & LEVEL SIMULATOR (5 cols) */}
          <div className="lg:col-span-5 bg-gradient-to-b from-slate-50 to-slate-100/70 dark:from-slate-800/50 dark:to-slate-800/20 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#082F49] dark:text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-cyan-600" />
                Simulateur & Jauge Piézométrique
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">Temps réel</span>
            </div>

            {/* Visual Reservoir Tank Representation */}
            <div className="flex items-center gap-4">
              {/* Vertical Tank Glass */}
              <div className="relative w-28 h-56 bg-slate-900/90 dark:bg-slate-950 rounded-2xl border-2 border-slate-700 p-1 flex flex-col justify-end overflow-hidden shadow-inner">
                {/* Background Ruler Grid */}
                <div className="absolute inset-0 flex flex-col justify-between p-2 pointer-events-none opacity-20 text-[9px] text-white font-mono">
                  <span>100%</span>
                  <span>75%</span>
                  <span>50%</span>
                  <span>25%</span>
                  <span>0%</span>
                </div>

                {/* Seuil Alerte Marker Line */}
                <div
                  className="absolute left-0 right-0 border-b-2 border-dashed border-amber-400 z-20 flex items-center justify-end pr-1 pointer-events-none transition-all duration-300"
                  style={{ bottom: `${pushConfig.seuilAlertePourcent}%` }}
                >
                  <span className="text-[9px] bg-amber-500 text-slate-950 font-bold px-1 rounded font-mono shadow-xs">
                    Alerte {pushConfig.seuilAlertePourcent}%
                  </span>
                </div>

                {/* Seuil Critique Marker Line */}
                <div
                  className="absolute left-0 right-0 border-b-2 border-rose-500 z-20 flex items-center justify-end pr-1 pointer-events-none transition-all duration-300"
                  style={{ bottom: `${pushConfig.seuilCritiqueArretPourcent}%` }}
                >
                  <span className="text-[9px] bg-rose-600 text-white font-bold px-1 rounded font-mono shadow-xs">
                    Arrêt {pushConfig.seuilCritiqueArretPourcent}%
                  </span>
                </div>

                {/* Liquid Water Column */}
                <div
                  className={`w-full rounded-b-xl transition-all duration-500 relative overflow-hidden ${
                    simulatedLevel <= pushConfig.seuilCritiqueArretPourcent
                      ? 'bg-gradient-to-t from-rose-700 via-rose-600 to-red-500 animate-pulse'
                      : simulatedLevel <= pushConfig.seuilAlertePourcent
                      ? 'bg-gradient-to-t from-amber-600 via-amber-500 to-orange-400'
                      : 'bg-gradient-to-t from-cyan-600 via-sky-500 to-cyan-400'
                  }`}
                  style={{ height: `${Math.max(4, simulatedLevel)}%` }}
                >
                  {/* Wave effect animation */}
                  <div className="absolute inset-x-0 top-0 h-2 bg-white/30 rounded-full blur-[1px]" />
                </div>

                {/* Current Value Display Inside Tank */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                  <div className="text-3xl font-black text-white font-mono drop-shadow-md">
                    {simulatedLevel}%
                  </div>
                  <div className="text-[9px] font-semibold text-white/80 uppercase tracking-wider">
                    Niveau Forage
                  </div>
                </div>
              </div>

              {/* Dynamic Status & Info beside the Tank */}
              <div className="flex-1 space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] font-medium block">Diagnostic du Niveau :</span>
                  {simulatedLevel <= pushConfig.seuilCritiqueArretPourcent ? (
                    <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 mt-1">
                      <div className="font-extrabold flex items-center gap-1 text-xs">
                        <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
                        DANGER MARCHE À SEC
                      </div>
                      <p className="text-[11px] text-rose-800 dark:text-rose-300 mt-0.5 leading-snug">
                        Arrêt d'urgence de la pompe requis. Risque de surchauffe moteur immédiat.
                      </p>
                    </div>
                  ) : simulatedLevel <= pushConfig.seuilAlertePourcent ? (
                    <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 mt-1">
                      <div className="font-extrabold flex items-center gap-1 text-xs">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        SEUIL D'ALERTE FRANCHI
                      </div>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5 leading-snug">
                        Notification push envoyée aux fontainiers & techniciens pour surveillance.
                      </p>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 mt-1">
                      <div className="font-extrabold flex items-center gap-1 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        Niveau Nominal Sécurisé
                      </div>
                      <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-0.5 leading-snug">
                        Nappe phréatique stable, immersion complète de la pompe immergée.
                      </p>
                    </div>
                  )}
                </div>

                {/* Slider for interactive testing */}
                <div>
                  <div className="flex justify-between text-[11px] text-slate-500 font-semibold mb-1">
                    <span>Ajuster le niveau simulé :</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{simulatedLevel}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={simulatedLevel}
                    onChange={(e) => setSimulatedLevel(Number(e.target.value))}
                    className="w-full accent-cyan-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => setSimulatedLevel(10)}
                      className="px-2 py-1 text-[10px] font-bold rounded-lg bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 text-rose-800 dark:text-rose-200 cursor-pointer transition"
                    >
                      10% (Critique)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimulatedLevel(20)}
                      className="px-2 py-1 text-[10px] font-bold rounded-lg bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 text-amber-800 dark:text-amber-200 cursor-pointer transition"
                    >
                      20% (Alerte)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimulatedLevel(60)}
                      className="px-2 py-1 text-[10px] font-bold rounded-lg bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 text-emerald-800 dark:text-emerald-200 cursor-pointer transition"
                    >
                      60% (Normal)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Test alert trigger for simulated level */}
            <button
              type="button"
              onClick={handleTriggerTestPush}
              className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <BellRing className="w-4 h-4 text-cyan-600" />
              <span>Simuler le déclenchement de l'alerte ({simulatedLevel}%)</span>
            </button>
          </div>

          {/* RIGHT: CONFIGURATION PARAMETERS & THRESHOLDS (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Row 1: Thresholds Configuration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Seuil Alerte Basse */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    Seuil d'alerte bas (%)
                  </label>
                  <span className="text-sm font-black font-mono text-amber-600 dark:text-amber-400">
                    &lt; {pushConfig.seuilAlertePourcent}%
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={pushConfig.seuilAlertePourcent}
                  onChange={(e) => updatePushConfig({ seuilAlertePourcent: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Sensible (5%)</span>
                  <span>Défaut : 25%</span>
                  <span>Prudent (50%)</span>
                </div>
                <div className="flex gap-1 pt-1">
                  {[15, 20, 25, 30].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => updatePushConfig({ seuilAlertePourcent: val })}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                        pushConfig.seuilAlertePourcent === val
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Seuil Critique Arrêt Pompe */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    Seuil arrêt d'urgence (%)
                  </label>
                  <span className="text-sm font-black font-mono text-rose-600 dark:text-rose-400">
                    &lt; {pushConfig.seuilCritiqueArretPourcent}%
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="5"
                  value={pushConfig.seuilCritiqueArretPourcent}
                  onChange={(e) =>
                    updatePushConfig({
                      seuilCritiqueArretPourcent: Math.min(Number(e.target.value), pushConfig.seuilAlertePourcent - 5),
                    })
                  }
                  className="w-full accent-rose-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>5%</span>
                  <span>Protection pompe : 15%</span>
                  <span>30%</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 pt-1">
                  Protège la pompe immergée contre la cavitation & le désamorçage.
                </p>
              </div>
            </div>

            {/* Row 2: Forage target & frequency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Périmètre des Forages Surveillés
                </label>
                <select
                  value={pushConfig.forageCibleId}
                  onChange={(e) => updatePushConfig({ forageCibleId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="ALL">Tous les forages du réseau (Supervision globale)</option>
                  {forages.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nom} ({f.code} • {f.localite} - {f.profondeurMetres}m)
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Applique les règles de surveillance aux capteurs de ce périmètre.
                </span>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Fréquence de Répétition des Alertes
                </label>
                <select
                  value={pushConfig.frequenceRepetitionMinutes}
                  onChange={(e) => updatePushConfig({ frequenceRepetitionMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value={0}>Alerte immédiate uniquement (1 seule notification)</option>
                  <option value={15}>Répéter toutes les 15 minutes si le niveau persiste bas</option>
                  <option value={30}>Répéter toutes les 30 minutes</option>
                  <option value={60}>Répéter toutes les heures</option>
                </select>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Évite la saturation des notifications tout en maintenant l'attention.
                </span>
              </div>
            </div>

            {/* Row 3: Target Roles (Recipients) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                Destinataires de l'alerte Push (Rôles opérationnels)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { role: 'FONTAINIER' as UserRole, label: 'Fontainiers', desc: 'Terrain & Bornes' },
                  { role: 'ADMIN_FORAGE' as UserRole, label: 'Technicien Forage', desc: 'Maintenance' },
                  { role: 'ADMIN_ORG' as UserRole, label: 'Direction ASUFOR', desc: 'Gestionnaire' },
                  { role: 'TRESORIER' as UserRole, label: 'Trésorier', desc: 'Exploitation' },
                ].map((item) => {
                  const isChecked = pushConfig.destinatairesRoles.includes(item.role);
                  return (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => toggleRole(item.role)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        isChecked
                          ? 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-400 dark:border-cyan-700 text-[#082F49] dark:text-cyan-200 shadow-xs'
                          : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-xs">{item.label}</span>
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] ${
                            isChecked
                              ? 'bg-cyan-600 text-white'
                              : 'border border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1">{item.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 4: Multimedia & Escalation */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Canaux d'Alerte Complémentaires & Astreinte
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* Sonore */}
                <label className="flex items-start gap-2 cursor-pointer p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <input
                    type="checkbox"
                    checked={pushConfig.sonAlerteActive}
                    onChange={(e) => updatePushConfig({ sonAlerteActive: e.target.checked })}
                    className="w-4 h-4 mt-0.5 text-cyan-600 rounded cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Signal sonore</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          playAlertTone();
                        }}
                        className="text-[10px] text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-0.5 cursor-pointer font-bold"
                        title="Tester le son"
                      >
                        <Play className="w-2.5 h-2.5" /> Écouter
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Bip d'urgence immédiat</span>
                  </div>
                </label>

                {/* Vibreur */}
                <label className="flex items-start gap-2 cursor-pointer p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <input
                    type="checkbox"
                    checked={pushConfig.vibreurMobileActive}
                    onChange={(e) => updatePushConfig({ vibreurMobileActive: e.target.checked })}
                    className="w-4 h-4 mt-0.5 text-cyan-600 rounded cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">Vibreur PWA</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Vibration tactile sur mobile</span>
                  </div>
                </label>

                {/* Doubler SMS */}
                <label className="flex items-start gap-2 cursor-pointer p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <input
                    type="checkbox"
                    checked={pushConfig.doublerSmsUrgenceTechnicien}
                    onChange={(e) => updatePushConfig({ doublerSmsUrgenceTechnicien: e.target.checked })}
                    className="w-4 h-4 mt-0.5 text-cyan-600 rounded cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">Escalade SMS</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">SMS si niveau critique &gt; 30m</span>
                  </div>
                </label>
              </div>

              {pushConfig.doublerSmsUrgenceTechnicien && (
                <div className="pt-1">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Numéro de Téléphone de l'Astreinte Technique 24/7 (Sénégal) :
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={pushConfig.telephoneAstreinteTechnique}
                      onChange={(e) => updatePushConfig({ telephoneAstreinteTechnique: e.target.value })}
                      placeholder="+221 77 000 00 00"
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs font-bold"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Notification Preview Card (How it appears on recipient device) */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                  <BellRing className="w-3.5 h-3.5" />
                  <span>Aperçu de la notification reçue sur mobile / bureau</span>
                </div>
                <span className="font-mono">À l'instant</span>
              </div>
              <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 flex items-center justify-center shrink-0 font-black text-xs">
                  H2O
                </div>
                <div className="flex-1 text-xs">
                  <div className="font-extrabold text-white flex items-center gap-1.5">
                    <span>FACTUREAU • Alerte Niveau Bas Forage</span>
                    <span className="text-[10px] bg-rose-500/30 text-rose-300 px-1.5 py-0.2 rounded font-mono font-bold">
                      URGENT
                    </span>
                  </div>
                  <p className="text-slate-300 mt-1 text-[11px] leading-relaxed">
                    Le Forage Touba Toul Centre (F1) a franchi le seuil d'alerte ({simulatedLevel}% restant). Risque imminent de désamorçage de pompe.
                  </p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onNavigate && onNavigate('forages')}
                      className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold transition cursor-pointer"
                    >
                      Vérifier le forage
                    </button>
                    <button
                      type="button"
                      onClick={() => toast.success("Simulation : Ordre d'arrêt sécurité pompe envoyé avec succès via télétransmission !")}
                      className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] font-semibold transition cursor-pointer"
                    >
                      Couper la pompe
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: PASSERELLE & REÇUS PAIEMENT */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-4">
        <h3 className="font-extrabold text-[#082F49] dark:text-cyan-300 text-base flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          4. Paramètres de la Passerelle Télécom & Sender ID
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
              Fournisseur Télécom National
            </label>
            <select
              value={config.provider}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  provider: e.target.value as SmsGatewayConfig['provider'],
                }))
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
            >
              <option value="ORANGE_SENEGAL">Orange SMS API Sénégal (Sonatel Direct)</option>
              <option value="INTOUCH">InTouch Sénégal (Passerelle Intégrée Wave/OM)</option>
              <option value="TWILIO">Twilio Cloud Télécom</option>
              <option value="SIMULATEUR">Simulateur Test Télécom</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
              Nom de l'Expéditeur SMS (Sender ID)
            </label>
            <input
              type="text"
              maxLength={11}
              value={config.senderId}
              onChange={(e) => setConfig((prev) => ({ ...prev, senderId: e.target.value.toUpperCase() }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono uppercase font-bold"
            />
            <span className="text-[10px] text-slate-400 block mt-0.5">Apparaît sur les téléphones des abonnés (Max 11 car.)</span>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
              Reçu de paiement instantané
            </label>
            <label className="flex items-center gap-2 mt-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={config.autoSendPaiement}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, autoSendPaiement: e.target.checked }))
                }
                className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
              />
              <span>SMS de quittance immédiat lors d'un encaissement</span>
            </label>
          </div>
        </div>
      </div>

      {/* SECTION 5: DERNIERS SMS EXPÉDIÉS AUTOMATIQUEMENT */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-500" />
            <h3 className="font-extrabold text-[#082F49] dark:text-cyan-300 text-base">
              5. Journal Récent des Alertes SMS Expédiées
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">{notifications.length} notifications enregistrées</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
          {notifications.slice(0, 8).map((n) => (
            <div key={n.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-slate-50/50 dark:bg-slate-800/30">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] font-bold px-2 py-0.2 rounded-full border ${
                      n.type === 'COUPURE_IMMINENTE'
                        ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                        : n.type === 'NOUVELLE_FACTURE'
                        ? 'bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800'
                        : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    }`}
                  >
                    {n.type === 'COUPURE_IMMINENTE'
                      ? '⚠️ COUPURE'
                      : n.type === 'NOUVELLE_FACTURE'
                      ? '💧 FACTURE'
                      : '✓ REÇU'}
                  </span>
                  <strong className="text-slate-800 dark:text-slate-200">{n.destinataireNom}</strong>
                  <span className="font-mono text-slate-500 text-[11px]">{n.destinataireTel}</span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300 truncate max-w-xl">
                  {n.message}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 text-[11px]">
                <span className="font-mono text-slate-400">{n.dateEnvoi}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Délivré
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mini Modal Recharge Crédits SMS */}
      {showRechargeModal && (
        <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs">
            <h4 className="font-extrabold text-[#082F49] dark:text-cyan-300 text-sm mb-1 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-cyan-500" />
              Recharger des Crédits SMS
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">
              Packs télécom prépayés pour l'envoi des factures et alertes coupures :
            </p>

            <div className="space-y-2.5 mb-5">
              <button
                onClick={() => handleRechargeCredits(100)}
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-cyan-500 bg-slate-50 dark:bg-slate-800 flex items-center justify-between cursor-pointer font-medium transition"
              >
                <span>+ 100 SMS</span>
                <span className="font-mono font-bold text-cyan-600">1 200 FCFA</span>
              </button>
              <button
                onClick={() => handleRechargeCredits(500)}
                className="w-full p-3 rounded-2xl border-2 border-cyan-500/60 hover:border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/40 flex items-center justify-between cursor-pointer font-bold transition"
              >
                <span>+ 500 SMS (Recommandé)</span>
                <span className="font-mono text-cyan-600">5 500 FCFA</span>
              </button>
              <button
                onClick={() => handleRechargeCredits(1000)}
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-cyan-500 bg-slate-50 dark:bg-slate-800 flex items-center justify-between cursor-pointer font-medium transition"
              >
                <span>+ 1 000 SMS</span>
                <span className="font-mono font-bold text-cyan-600">10 000 FCFA</span>
              </button>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowRechargeModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer font-semibold"
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
