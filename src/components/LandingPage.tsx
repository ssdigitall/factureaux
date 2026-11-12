import React, { useState } from 'react';
import {
  Droplets,
  Users,
  Gauge,
  Receipt,
  Smartphone,
  Wallet,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  PhoneCall,
  Mail,
  MapPin,
  Clock,
  Layers,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

interface LandingPageProps {
  onStartFree: () => void;
  onExploreDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartFree, onExploreDemo }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'FACTUREAU est-il adapté aux ASUFOR et comités de gestion en zone rurale ?',
      a: 'Absolument. FACTUREAU a été conçu sur le terrain pour répondre aux réalités des ASUFOR, comités villageois, mairies et délégataires privés d eau au Sénégal et en Afrique de l Ouest. L interface est ergonomique, rapide et pensée pour fonctionner sur mobile même avec une connectivité 3G/4G faible.',
    },
    {
      q: 'Comment s effectuent les paiements par Wave et Orange Money ?',
      a: 'L application génère des factures avec QR codes uniques. L abonné ou le trésorier peut scanner pour régler directement via Wave ou déclencher une notification Orange Money. L encaissement est sécurisé par webhook et réconcilié instantanément avec le compte de caisse.',
    },
    {
      q: 'Nos données sont-elles protégées entre différentes associations ?',
      a: 'Oui. FACTUREAU applique une isolation multi-tenant stricte basée sur PostgreSQL Row Level Security (RLS). Aucune association ou agent ne peut voir ni modifier les données d une autre structure. Chaque action financière est tracée dans un journal d audit infalsifiable.',
    },
    {
      q: 'Peut-on imprimer les factures et reçus sur des imprimantes thermiques ?',
      a: 'Oui. Le système prend en charge l impression au format A4 ainsi que les formats tickets de caisse / reçus thermiques Bluetooth (58mm/80mm) et le partage immédiat par WhatsApp.',
    },
    {
      q: 'Comment calculer le taux de perte d eau (eau non comptabilisée) ?',
      a: 'Le module Production compare automatiquement le volume d eau pompé au compteur général du forage avec la somme des volumes distribués aux abonnés et bornes-fontaines, calculant en temps réel le taux de pertes avec une alerte dès dépassement du seuil de 18%.',
    },
    {
      q: 'Les dépenses peuvent-elles être supprimées par erreur ?',
      a: 'Non. Selon les principes stricts de gouvernance financière, aucune dépense validée ne peut être supprimée physiquement de la base de données. Elle peut uniquement faire l objet d une annulation formelle et motivée par le trésorier ou l administrateur.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-cyan-500 selection:text-white transition-colors">
      {/* ━━━━━━━━━━━━━━━━ HERO SECTION ━━━━━━━━━━━━━━━━ */}
      <section id="hero" className="relative overflow-hidden bg-gradient-to-b from-[#082F49] via-[#0c3e60] to-[#082F49] text-white pt-16 pb-24 lg:pt-20 lg:pb-32">
        {/* Ambient background water glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-sky-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-semibold tracking-wide uppercase mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              SaaS N°1 de gestion des forages en Afrique francophone
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight mb-6">
              Gérez votre forage en toute simplicité.
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 font-normal leading-relaxed mb-8">
              Centralisez vos abonnés, relevés, factures, paiements, dépenses et rapports dans une seule plateforme intelligente et sécurisée.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={onStartFree}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-[#0369A1] hover:from-cyan-400 hover:to-sky-600 text-white font-bold text-base shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Commencer gratuitement</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onExploreDemo}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 font-semibold text-base transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Droplets className="w-5 h-5 text-cyan-400" />
                <span>Découvrir FACTUREAU</span>
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Compatible Wave & Orange Money
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Sécurité RLS multi-organisations
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Conforme normes hydrauliques OFOR
              </span>
            </div>
          </div>

          {/* Interactive Live Dashboard Mockup with Demo Figures */}
          <div className="relative mx-auto max-w-5xl rounded-2xl bg-slate-900/90 p-3 sm:p-5 border border-sky-800/60 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4 px-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs font-mono text-slate-400">
                  app.factureau.sn/dashboard — ASUFOR de Touba Toul
                </span>
              </div>
              <div className="bg-sky-950/80 text-cyan-300 text-[11px] font-medium px-2.5 py-1 rounded border border-cyan-800/60">
                Aperçu démonstration en direct (chiffres indicatifs)
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
                <div className="text-[11px] text-slate-400 font-medium">Abonnés actifs</div>
                <div className="text-xl font-bold text-white mt-1">428</div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                  <TrendingUp className="w-3 h-3" /> +12 ce mois
                </div>
              </div>

              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
                <div className="text-[11px] text-slate-400 font-medium">Recettes du mois</div>
                <div className="text-xl font-bold text-emerald-400 mt-1">1 245 000 F</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Wave & Espèces</div>
              </div>

              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
                <div className="text-[11px] text-slate-400 font-medium">Dépenses validées</div>
                <div className="text-xl font-bold text-rose-400 mt-1">385 400 F</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Carburant, Senelec, réseau</div>
              </div>

              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
                <div className="text-[11px] text-slate-400 font-medium">Solde de caisse</div>
                <div className="text-xl font-bold text-cyan-300 mt-1">2 977 900 F</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Caisse + Wave + Banque</div>
              </div>

              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60 col-span-2 sm:col-span-1">
                <div className="text-[11px] text-slate-400 font-medium">Factures impayées</div>
                <div className="text-xl font-bold text-amber-400 mt-1">182 500 F</div>
                <div className="text-[10px] text-amber-300/80 mt-0.5">8 relances WhatsApp</div>
              </div>
            </div>

            {/* Financial & Water Balance mini graphic */}
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-left w-full sm:w-auto">
                <div className="text-xs font-semibold text-white flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-cyan-400" />
                  Bilan Eau & Production : 870 m³ pompés / 735 m³ facturés
                </div>
                <div className="text-[11px] text-slate-400">
                  Taux estimé de pertes réseau : <strong className="text-emerald-400">15.5%</strong> (Seuil alerte : 18%)
                </div>
              </div>
              <button
                onClick={onExploreDemo}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition shadow-md w-full sm:w-auto text-center cursor-pointer"
              >
                Ouvrir le tableau de bord complet
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━ SECTION FONCTIONNALITÉS ━━━━━━━━━━━━━━━━ */}
      <section id="features" className="py-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-200 dark:border-cyan-800">
              Fonctionnalités Clés
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#082F49] dark:text-sky-300 mt-3">
              Une solution tout-en-un pensée pour le terrain
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mt-3">
              Fini les cahiers de relevés égarés, les calculs manuels et les litiges de caisse.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-slate-50 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 p-8 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 hover:border-cyan-400/80 shadow-sm hover:shadow-xl transition-all group">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#082F49] dark:text-sky-300 mb-2">1. Gestion des abonnés</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Fiches abonnés complètes, quartiers, compteurs rattachés, catégories tarifaires (domestique, maraîcher, commercial), suspension, clôture et exports CSV.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-50 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 p-8 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 hover:border-cyan-400/80 shadow-sm hover:shadow-xl transition-all group">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Gauge className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#082F49] dark:text-sky-300 mb-2">2. Relevés et consommations</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Tournées de relevés simplifiées. Calcul automatique des volumes m³, détection immédiate des index incohérents et alertes de surconsommation anormale.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-50 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 p-8 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 hover:border-cyan-400/80 shadow-sm hover:shadow-xl transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#082F49] dark:text-sky-300 mb-2">3. Facturation automatique</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Émission individuelle ou en lot. Factures professionnelles avec logo, numéro unique, QR code de paiement, impression et partage instantané sur WhatsApp.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-slate-50 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 p-8 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 hover:border-cyan-400/80 shadow-sm hover:shadow-xl transition-all group">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#082F49] dark:text-sky-300 mb-2">4. Paiements sécurisés</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Intégration PayDunya, Wave, Orange Money, Espèces et Virement. Paiements partiels ou complets, reçus automatiques et protection anti-doublon idempotente.
              </p>
            </div>

            {/* Card 5 */}
            <div className="bg-slate-50 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 p-8 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 hover:border-cyan-400/80 shadow-sm hover:shadow-xl transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#082F49] dark:text-sky-300 mb-2">5. Gestion des dépenses & Caisse</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Suivi multi-comptes (Espèces, Mobile Money, Banque). Dépenses avec justificatifs photo, validation hiérarchique et traçabilité sans suppression physique.
              </p>
            </div>

            {/* Card 6 */}
            <div className="bg-slate-50 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 p-8 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 hover:border-cyan-400/80 shadow-sm hover:shadow-xl transition-all group">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#082F49] dark:text-sky-300 mb-2">6. Rapports professionnels</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Bilans journaliers, mensuels et annuels. Suivi de la production d'eau, calcul des taux de fuite réseau (NRW), gestion des pannes et exports comptables.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━ SECTION COMMENT ÇA MARCHE ━━━━━━━━━━━━━━━━ */}
      <section id="how-it-works" className="py-20 bg-slate-100 dark:bg-slate-900/60 border-y border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0369A1] dark:text-sky-400 bg-sky-100 dark:bg-sky-950/60 px-3 py-1 rounded-full">
              Simplicité & Rapidité
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#082F49] dark:text-sky-300 mt-3">
              Opérationnel en 3 étapes simples
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-white dark:bg-slate-850 dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 text-center relative z-10">
              <div className="w-14 h-14 rounded-full bg-[#082F49] dark:bg-sky-700 text-white text-xl font-extrabold flex items-center justify-center mx-auto mb-6 shadow-md">
                1
              </div>
              <h3 className="text-xl font-bold text-[#082F49] dark:text-sky-300 mb-3">Créer son compte</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Inscrivez votre organisation (ASUFOR, comité villageois, régie d'eau ou entreprise) et invitez vos agents avec des rôles sur mesure.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white dark:bg-slate-850 dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 text-center relative z-10">
              <div className="w-14 h-14 rounded-full bg-[#0369A1] dark:bg-cyan-600 text-white text-xl font-extrabold flex items-center justify-center mx-auto mb-6 shadow-md">
                2
              </div>
              <h3 className="text-xl font-bold text-[#082F49] dark:text-sky-300 mb-3">Configurer forage et abonnés</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Enregistrez vos forages, bornes-fontaines et compteurs. Importez facilement la liste de vos abonnés par fichier Excel / CSV.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white dark:bg-slate-850 dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 text-center relative z-10">
              <div className="w-14 h-14 rounded-full bg-cyan-600 dark:bg-teal-600 text-white text-xl font-extrabold flex items-center justify-center mx-auto mb-6 shadow-md">
                3
              </div>
              <h3 className="text-xl font-bold text-[#082F49] dark:text-sky-300 mb-3">Gérer son activité</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Saisissez les index sur mobile, éditez les factures, encaissez les paiements Wave et suivez votre solde de caisse en temps réel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━ SECTION TARIFS ━━━━━━━━━━━━━━━━ */}
      <section id="pricing" className="py-20 bg-white dark:bg-slate-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              Tarification Transparente
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#082F49] dark:text-sky-300 mt-3">
              Des forfaits adaptés à chaque taille de réseau
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 italic">
              Ces prix sont provisoires et configurables selon vos besoins.
            </p>

            {/* Billing Cycle Toggle */}
            <div className="mt-6 inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                  billingCycle === 'monthly' ? 'bg-[#082F49] dark:bg-sky-600 text-white shadow' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Paiement Mensuel
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  billingCycle === 'yearly' ? 'bg-[#082F49] dark:bg-sky-600 text-white shadow' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Paiement Annuel</span>
                <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.2 rounded font-semibold">
                  2 mois offerts
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Plan 1: Essentiel */}
            <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 flex flex-col justify-between hover:shadow-xl transition-shadow">
              <div>
                <h3 className="text-xl font-bold text-[#082F49] dark:text-sky-300">ESSENTIEL</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Idéal pour petit forage villageois ou comité local</p>
                <div className="my-6">
                  <span className="text-4xl font-extrabold text-[#082F49] dark:text-sky-300">
                    {billingCycle === 'monthly' ? '9 900' : '99 000'}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                    FCFA {billingCycle === 'monthly' ? '/mois' : '/an'}
                  </span>
                </div>
                <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-700 pt-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <strong>1 forage</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    Jusqu'à <strong>300 abonnés</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <strong>3 utilisateurs</strong> (Admin, Releveur, Trésorier)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    Facturation automatique
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    Paiements (Espèces, Wave)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    Rapports simples
                  </li>
                </ul>
              </div>
              <button
                onClick={onStartFree}
                className="mt-8 w-full py-3 px-4 rounded-xl border border-[#082F49] dark:border-sky-500 text-[#082F49] dark:text-sky-400 hover:bg-[#082F49] dark:hover:bg-sky-600 hover:text-white font-semibold text-sm transition text-center cursor-pointer"
              >
                Choisir Essentiel
              </button>
            </div>

            {/* Plan 2: Professionnel (POPULAIRE) */}
            <div className="bg-gradient-to-b from-sky-950 to-[#082F49] text-white rounded-2xl border-2 border-cyan-400 p-8 flex flex-col justify-between shadow-2xl relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-cyan-400 text-slate-950 text-[11px] font-extrabold uppercase px-3 py-1 rounded-full tracking-wider shadow">
                Plus populaire (Recommandé)
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">PROFESSIONNEL</h3>
                <p className="text-xs text-cyan-200 mt-1">Pour ASUFOR moyenne à forte densité d'abonnés</p>
                <div className="my-6">
                  <span className="text-4xl font-extrabold text-cyan-300">
                    {billingCycle === 'monthly' ? '19 900' : '199 000'}
                  </span>
                  <span className="text-xs text-slate-300 ml-1">
                    FCFA {billingCycle === 'monthly' ? '/mois' : '/an'}
                  </span>
                </div>
                <ul className="space-y-3 text-sm text-slate-200 border-t border-sky-800/80 pt-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <strong>3 forages</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    Jusqu'à <strong>1 500 abonnés</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <strong>10 utilisateurs</strong> avec permissions avancées
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    Gestion des dépenses & Caisse multi-comptes
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    Bornes-fontaines & ventes journalières
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    Suivi de production & pertes d'eau (NRW)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    Rapports avancés et exports Excel
                  </li>
                </ul>
              </div>
              <button
                onClick={onStartFree}
                className="mt-8 w-full py-3.5 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-sm transition shadow-lg shadow-cyan-400/20 text-center cursor-pointer"
              >
                Démarrer l'essai Professionnel
              </button>
            </div>

            {/* Plan 3: Entreprise */}
            <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 flex flex-col justify-between hover:shadow-xl transition-shadow">
              <div>
                <h3 className="text-xl font-bold text-[#082F49] dark:text-sky-300">ENTREPRISE</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pour délégataires régionaux et réseaux multi-sites</p>
                <div className="my-6">
                  <span className="text-4xl font-extrabold text-[#082F49] dark:text-sky-300">
                    {billingCycle === 'monthly' ? '29 900' : '299 000'}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                    FCFA {billingCycle === 'monthly' ? '/mois' : '/an'}
                  </span>
                </div>
                <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-700 pt-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <strong>10 forages</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    Jusqu'à <strong>5 000 abonnés</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <strong>25 utilisateurs</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    Gestion multi-forages centralisée
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    Permissions granulaires & audit complet
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    Tous les modules disponibles
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    Exports complets & support dédié 7j/7
                  </li>
                </ul>
              </div>
              <button
                onClick={onStartFree}
                className="mt-8 w-full py-3 px-4 rounded-xl border border-[#082F49] dark:border-sky-500 text-[#082F49] dark:text-sky-400 hover:bg-[#082F49] dark:hover:bg-sky-600 hover:text-white font-semibold text-sm transition text-center cursor-pointer"
              >
                Choisir Entreprise
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━ SECTION FAQ INTERACTIVE ━━━━━━━━━━━━━━━━ */}
      <section id="faq" className="py-20 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400 bg-cyan-100/60 dark:bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-200 dark:border-cyan-800">
              Foire Aux Questions
            </span>
            <h2 className="text-3xl font-extrabold text-[#082F49] dark:text-sky-300 mt-3">
              Questions fréquemment posées
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-semibold text-[#082F49] dark:text-sky-300 hover:text-cyan-700 dark:hover:text-cyan-400 transition"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform ${
                        isOpen ? 'rotate-180 text-cyan-600 dark:text-cyan-400' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━ FOOTER PROFESSIONNEL ━━━━━━━━━━━━━━━━ */}
      <footer id="contact" className="bg-[#082F49] dark:bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-sky-950 dark:border-slate-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-sky-900/60 dark:border-slate-800">
            {/* Col 1: Brand & Presentation */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-[#0369A1] p-0.5 flex items-center justify-center">
                  <div className="w-full h-full bg-[#082F49] dark:bg-slate-900 rounded-[10px] flex items-center justify-center">
                    <Droplets className="w-5 h-5 text-cyan-400" />
                  </div>
                </div>
                <div>
                  <span className="text-xl font-extrabold text-white tracking-tight">FACTUREAU</span>
                  <div className="text-[10px] text-cyan-300 font-medium">« L'eau bien gérée, l'avenir assuré. »</div>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                La plateforme SaaS de référence pour la gestion financière, technique et administrative des forages et de la distribution d'eau potable au Sénégal et en Afrique francophone.
              </p>
              <div className="flex items-center gap-3 text-xs text-slate-400 pt-2">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Dakar, Sénégal
                </span>
                <span className="flex items-center gap-1">
                  <PhoneCall className="w-3.5 h-3.5 text-cyan-400" /> +221 33 800 00 00
                </span>
              </div>
            </div>

            {/* Col 2: Fonctionnalités */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Fonctionnalités</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>Abonnés & Compteurs</li>
                <li>Tournées de relevés</li>
                <li>Facturation automatique</li>
                <li>Paiements Wave & OM</li>
                <li>Dépenses & Caisse</li>
                <li>Bornes-fontaines</li>
              </ul>
            </div>

            {/* Col 3: Tarifs & Déploiement */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Plateforme</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>Forfait Essentiel</li>
                <li>Forfait Professionnel</li>
                <li>Forfait Entreprise</li>
                <li>Schéma PostgreSQL Supabase</li>
                <li>Audit de Sécurité RLS</li>
              </ul>
            </div>

            {/* Col 4: Légal & Conformité */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Conformité</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>Conditions Générales d'Utilisation</li>
                <li>Politique de Confidentialité</li>
                <li>Protection des données personnelles (CDP)</li>
                <li>Mentions Légales</li>
                <li>Normes Hydrauliques Rurales</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <div>
              &copy; {new Date().getFullYear()} FACTUREAU SaaS. Tous droits réservés. L'eau bien gérée, l'avenir assuré.
            </div>
            <div className="flex items-center gap-4">
              <button onClick={onExploreDemo} className="hover:text-cyan-400 transition cursor-pointer">
                Démo interactive
              </button>
              <span>•</span>
              <button onClick={onStartFree} className="hover:text-cyan-400 transition cursor-pointer">
                Espace Client
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
