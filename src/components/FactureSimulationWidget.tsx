import React, { useState } from 'react';
import {
  Calculator,
  Droplets,
  DollarSign,
  ArrowRight,
  Sparkles,
  HelpCircle,
  RotateCcw,
  CheckCircle2,
  FileText,
  Sliders,
} from 'lucide-react';
import { store } from '../services/store';
import { CategorieAbonne, Forage } from '../types';
import { formatFCFA, formatNumberDot } from '../utils/formatters';

interface FactureSimulationWidgetProps {
  onNavigate?: (module: string) => void;
}

export const FactureSimulationWidget: React.FC<FactureSimulationWidgetProps> = ({ onNavigate }) => {
  const forages = store.getForages();

  const [selectedForageId, setSelectedForageId] = useState<string>(forages[0]?.id || '');
  const [volumeM3, setVolumeM3] = useState<number>(22);
  const [categorie, setCategorie] = useState<CategorieAbonne>('DOMESTIQUE');
  const [useCustomTarif, setUseCustomTarif] = useState<boolean>(false);
  const [customTarifM3, setCustomTarifM3] = useState<number>(350);
  const [customRedevance, setCustomRedevance] = useState<number>(500);
  const [includeTVA, setIncludeTVA] = useState<boolean>(false); // 0% standard en milieu rural

  const selectedForage = forages.find((f) => f.id === selectedForageId) || forages[0];

  // Base tariffs from forage or custom
  const baseTarifM3 = useCustomTarif ? customTarifM3 : selectedForage?.tarifM3FCFA || 350;
  const baseRedevance = useCustomTarif ? customRedevance : selectedForage?.redevanceFixeFCFA || 500;

  // Category multiplier
  const categoryMultipliers: Record<CategorieAbonne, { factor: number; label: string; desc: string }> = {
    DOMESTIQUE: { factor: 1.0, label: 'Domestique (1.0x)', desc: 'Usage familial standard' },
    COMMERCIAL: { factor: 1.2, label: 'Commercial (1.2x)', desc: 'Boutiques, ateliers, gargotes' },
    MARAICHER: { factor: 0.9, label: 'Maraîcher (0.9x)', desc: 'Arrosage agricole & bétail' },
    SOCIAL: { factor: 0.8, label: 'Social (0.8x)', desc: 'Mosquées, écoles, dispensaires' },
  };

  const currentCatInfo = categoryMultipliers[categorie];
  const effectiveTarifM3 = Math.round(baseTarifM3 * currentCatInfo.factor);

  // Calculations
  const montantConsommationHT = Math.round(volumeM3 * effectiveTarifM3);
  const redevanceFixe = baseRedevance;
  const totalHT = montantConsommationHT + redevanceFixe;
  const tvaMontant = includeTVA ? Math.round(totalHT * 0.18) : 0;
  const totalTTC = totalHT + tvaMontant;

  // Quick volume presets (includes 34 m³ which yields exactly 12.500 FCFA at 350 F/m³ + 500 F redevance)
  const presets = [5, 12, 20, 34, 50, 80];

  const handleReset = () => {
    setVolumeM3(20);
    setCategorie('DOMESTIQUE');
    setUseCustomTarif(false);
    setIncludeTVA(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-sky-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-[#082F49] dark:text-cyan-300">
                Simulateur de Facturation d'Eau
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                Estimation temps réel
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Calculez instantanément le montant selon le volume d'eau (m³), le tarif du forage et la catégorie tarifaire.
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="text-xs text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 flex items-center gap-1.5 transition cursor-pointer px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0"
          title="Réinitialiser les paramètres"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Réinitialiser</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-4 text-xs">
          {/* Forage selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Forage d'adduction
              </label>
              <select
                value={selectedForageId}
                onChange={(e) => setSelectedForageId(e.target.value)}
                disabled={useCustomTarif}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
              >
                {forages.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nom} ({f.tarifM3FCFA} F/m³)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Catégorie d'abonné
              </label>
              <select
                value={categorie}
                onChange={(e) => setCategorie(e.target.value as CategorieAbonne)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="DOMESTIQUE">Domestique (x 1.0)</option>
                <option value="COMMERCIAL">Commercial (x 1.2)</option>
                <option value="MARAICHER">Maraîcher / Agricole (x 0.9)</option>
                <option value="SOCIAL">Social / Collectif (x 0.8)</option>
              </select>
            </div>
          </div>

          {/* Volume slider & numeric input */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>Volume d'eau consommé</span>
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={500}
                  step={1}
                  value={volumeM3}
                  onChange={(e) => setVolumeM3(Math.max(0, Number(e.target.value)))}
                  className="w-20 px-2.5 py-1 text-right font-mono font-extrabold text-base rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <span className="font-bold text-slate-600 dark:text-slate-300">m³</span>
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={0}
              max={120}
              value={volumeM3}
              onChange={(e) => setVolumeM3(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />

            {/* Presets buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mr-1">
                Préréglages rapides :
              </span>
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setVolumeM3(p)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer ${
                    volumeM3 === p
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600'
                  }`}
                >
                  {p} m³
                </button>
              ))}
            </div>
          </div>

          {/* Options: Custom Tariffs and TVA */}
          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCustomTarif}
                  onChange={(e) => setUseCustomTarif(e.target.checked)}
                  className="rounded text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  Personnaliser les paramètres tarifaires (simulation libre)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTVA}
                  onChange={(e) => setIncludeTVA(e.target.checked)}
                  className="rounded text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                />
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  Appliquer TVA (18%)
                </span>
              </label>
            </div>

            {useCustomTarif && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/80 dark:border-slate-700">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Tarif unitaire (FCFA / m³)
                  </label>
                  <input
                    type="number"
                    min={50}
                    step={10}
                    value={customTarifM3}
                    onChange={(e) => setCustomTarifM3(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Redevance fixe mensuelle (FCFA)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={customRedevance}
                    onChange={(e) => setCustomRedevance(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Live Breakdown Card (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-50 to-cyan-50/50 dark:from-slate-800/80 dark:to-slate-900 rounded-2xl border-2 border-cyan-200 dark:border-cyan-800/80 p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700/80 mb-3">
              <span className="font-extrabold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Détail du Calcul
              </span>
              <span className="text-[11px] font-mono font-bold text-cyan-700 dark:text-cyan-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-cyan-200 dark:border-cyan-800">
                {effectiveTarifM3} FCFA / m³
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>Consommation volumique ({volumeM3} m³) :</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                  {formatFCFA(montantConsommationHT)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>Redevance fixe d'abonnement :</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                  {formatFCFA(redevanceFixe)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>Sous-total Hors Taxes (HT) :</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                  {formatFCFA(totalHT)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>TVA {includeTVA ? '(18%)' : '(Exonérée 0%)'} :</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                  {formatFCFA(tvaMontant)}
                </span>
              </div>

              {/* Total Card */}
              <div className="pt-3 border-t-2 border-dashed border-cyan-300 dark:border-cyan-800 mt-2">
                <span className="block text-[10px] uppercase tracking-wider font-extrabold text-cyan-800 dark:text-cyan-300">
                  Total Net à Facturer (TTC)
                </span>
                <div className="text-2xl sm:text-3xl font-black text-[#082F49] dark:text-white font-mono mt-1">
                  {formatNumberDot(totalTTC)}{' '}
                  <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400">FCFA</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Équivaut à ~ {formatNumberDot(Math.round(totalTTC / (volumeM3 || 1)))} FCFA par m³ tout compris.
                </div>
              </div>
            </div>
          </div>

          {/* Action button to issue a real invoice */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700/80 mt-4 space-y-2">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('factures')}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Accéder aux Factures & Émettre</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <p className="text-[10px] text-center text-slate-400 dark:text-slate-500">
              Paramètres appliqués selon le règlement d'exploitation de l'ASUFOR.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
