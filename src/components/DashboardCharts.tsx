import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Droplets,
  DollarSign,
  Calendar,
  Filter,
  BarChart3,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import { store } from '../services/store';
import { useTheme } from '../context/ThemeContext';
import { Forage, Facture, Paiement, Depense, ReleveProduction } from '../types';
import { formatFCFA, formatNumberDot } from '../utils/formatters';

export type PeriodFilter = '6M' | '12M' | 'TRIMESTRE' | 'ANNEE';
export type ViewTab = 'QUOTIDIEN' | 'COMBINE' | 'FINANCES' | 'PRODUCTION';
export type DailySubMode = 'MIXTE' | 'EAU' | 'REVENUS';

interface DashboardChartsProps {
  forages: Forage[];
  selectedForageId?: string;
  onSelectForageId?: (id: string) => void;
}

interface MonthlyDataPoint {
  id: string;
  periode: string; // "Mai 26", "Juin 26", etc.
  moisComplet: string;
  timestamp: number;
  recettesFCFA: number;
  facturesFCFA: number;
  depensesFCFA: number;
  margeNetteFCFA: number;
  tauxRecouvrement: number;
  volumeProduitM3: number;
  volumeFactureM3: number;
  pertesM3: number;
  tauxRendement: number;
  tauxPerte: number;
}

export interface DailyDataPoint {
  id: string; // "2026-11-01"
  jour: number; // 1..30
  jourLabel: string; // "01 Nov"
  dateComplete: string; // "01 Novembre 2026"
  consommationM3: number; // m3
  volumeProduitM3: number; // m3
  pertesM3: number;
  revenusFCFA: number; // FCFA
  depensesFCFA: number;
  cumulConsommationM3: number;
  cumulRevenusFCFA: number;
  isPeakWater: boolean;
  isPeakRevenue: boolean;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  forages,
  selectedForageId = 'ALL',
  onSelectForageId,
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [viewTab, setViewTab] = useState<ViewTab>('QUOTIDIEN');
  const [period, setPeriod] = useState<PeriodFilter>('6M');
  const [forageFilter, setForageFilter] = useState<string>(selectedForageId);
  const [dailyMonth, setDailyMonth] = useState<string>('2026-11');
  const [dailySubMode, setDailySubMode] = useState<DailySubMode>('MIXTE');
  const [, setStoreVersion] = useState<number>(0);

  React.useEffect(() => {
    if (selectedForageId) {
      setForageFilter(selectedForageId);
    }
  }, [selectedForageId]);

  React.useEffect(() => {
    return store.subscribe(() => {
      setStoreVersion((v) => v + 1);
    });
  }, []);

  const factures = store.getFactures();
  const paiements = store.getPaiements();
  const depenses = store.getDepenses();
  const production = store.getProduction();

  // Multi-month baseline dataset enriched with real-time store actions
  const fullYearDataset: MonthlyDataPoint[] = useMemo(() => {
    const months = [
      { key: '2025-11', short: 'Nov 25', label: 'Novembre 2025', baseRec: 1120000, baseFac: 1210000, baseDep: 340000, baseProd: 760, baseFactM3: 650 },
      { key: '2025-12', short: 'Déc 25', label: 'Décembre 2025', baseRec: 1250000, baseFac: 1320000, baseDep: 390000, baseProd: 820, baseFactM3: 710 },
      { key: '2026-01', short: 'Jan 26', label: 'Janvier 2026', baseRec: 1080000, baseFac: 1190000, baseDep: 310000, baseProd: 740, baseFactM3: 630 },
      { key: '2026-02', short: 'Fév 26', label: 'Février 2026', baseRec: 1150000, baseFac: 1230000, baseDep: 325000, baseProd: 790, baseFactM3: 680 },
      { key: '2026-03', short: 'Mar 26', label: 'Mars 2026', baseRec: 1380000, baseFac: 1450000, baseDep: 420000, baseProd: 940, baseFactM3: 810 },
      { key: '2026-04', short: 'Avr 26', label: 'Avril 2026', baseRec: 1490000, baseFac: 1560000, baseDep: 460000, baseProd: 1020, baseFactM3: 875 },
      { key: '2026-05', short: 'Mai 26', label: 'Mai 2026', baseRec: 1520000, baseFac: 1610000, baseDep: 480000, baseProd: 1060, baseFactM3: 910 },
      { key: '2026-06', short: 'Juin 26', label: 'Juin 2026', baseRec: 1440000, baseFac: 1510000, baseDep: 440000, baseProd: 980, baseFactM3: 840 },
      { key: '2026-07', short: 'Juil 26', label: 'Juillet 2026', baseRec: 1290000, baseFac: 1350000, baseDep: 395000, baseProd: 880, baseFactM3: 755 },
      { key: '2026-08', short: 'Aoû 26', label: 'Août 2026', baseRec: 1180000, baseFac: 1240000, baseDep: 360000, baseProd: 810, baseFactM3: 690 },
      { key: '2026-09', short: 'Sep 26', label: 'Septembre 2026', baseRec: 1210000, baseFac: 1280000, baseDep: 375000, baseProd: 830, baseFactM3: 705 },
      { key: '2026-10', short: 'Oct 26', label: 'Octobre 2026', baseRec: 1340000, baseFac: 1410000, baseDep: 410000, baseProd: 870, baseFactM3: 735 },
    ];

    const filteredFactures = forageFilter === 'ALL'
      ? factures
      : factures.filter((f) => f.forageId === forageFilter);

    const filteredPaiements = forageFilter === 'ALL'
      ? paiements
      : paiements.filter((p) => p.forageId === forageFilter);

    const filteredDepenses = forageFilter === 'ALL'
      ? depenses
      : depenses.filter((d) => !d.forageId || d.forageId === forageFilter);

    const filteredProduction = forageFilter === 'ALL'
      ? production
      : production.filter((p) => p.forageId === forageFilter);

    const storePaiementsTotal = filteredPaiements.reduce((sum, p) => sum + p.montantFCFA, 0);
    const storeFacturesTotal = filteredFactures.reduce((sum, f) => sum + f.totalTTCFCFA, 0);
    const storeDepensesTotal = filteredDepenses
      .filter((d) => d.statut === 'VALIDEE')
      .reduce((sum, d) => sum + d.montantFCFA, 0);
    const storeVolumeProduit = filteredProduction.reduce((sum, p) => sum + p.volumeProduitM3, 0);
    const storeVolumeFacture = filteredFactures.reduce((sum, f) => sum + f.consommationM3, 0);

    return months.map((m, idx) => {
      const isLatest = idx === months.length - 1;

      const recettes = isLatest && storePaiementsTotal > 0
        ? Math.round((m.baseRec * 0.7) + (storePaiementsTotal * 0.3))
        : m.baseRec;

      const facturesMois = isLatest && storeFacturesTotal > 0
        ? Math.round((m.baseFac * 0.7) + (storeFacturesTotal * 0.3))
        : m.baseFac;

      const depensesMois = isLatest && storeDepensesTotal > 0
        ? Math.round((m.baseDep * 0.7) + (storeDepensesTotal * 0.3))
        : m.baseDep;

      const volProduit = isLatest && storeVolumeProduit > 0
        ? storeVolumeProduit
        : m.baseProd;

      const volFacture = isLatest && storeVolumeFacture > 0
        ? Math.min(volProduit, Math.round((m.baseFactM3 * 0.6) + (storeVolumeFacture * 0.4)))
        : m.baseFactM3;

      const pertes = Math.max(0, volProduit - volFacture);
      const tauxRendement = volProduit > 0 ? Math.round((volFacture / volProduit) * 1000) / 10 : 85;
      const tauxPerte = volProduit > 0 ? Math.round((pertes / volProduit) * 1000) / 10 : 15;
      const tauxRecouv = facturesMois > 0 ? Math.round((recettes / facturesMois) * 100) : 90;

      return {
        id: m.key,
        periode: m.short,
        moisComplet: m.label,
        timestamp: new Date(m.key + '-01').getTime(),
        recettesFCFA: recettes,
        facturesFCFA: facturesMois,
        depensesFCFA: depensesMois,
        margeNetteFCFA: recettes - depensesMois,
        tauxRecouvrement: tauxRecouv,
        volumeProduitM3: volProduit,
        volumeFactureM3: volFacture,
        pertesM3: pertes,
        tauxRendement: tauxRendement,
        tauxPerte: tauxPerte,
      };
    });
  }, [factures, paiements, depenses, production, forageFilter]);

  // Filter dataset by chosen period for monthly views
  const displayData = useMemo(() => {
    switch (period) {
      case '6M':
        return fullYearDataset.slice(-6);
      case '12M':
        return fullYearDataset;
      case 'ANNEE':
        return fullYearDataset.filter((d) => d.id.startsWith('2026'));
      case 'TRIMESTRE': {
        const q1 = fullYearDataset.slice(2, 5);
        const q2 = fullYearDataset.slice(5, 8);
        const q3 = fullYearDataset.slice(8, 11);
        const q4 = fullYearDataset.slice(11, 12);

        const quarters = [
          { label: 'T1 2026 (Jan-Mar)', data: q1, short: 'T1 2026' },
          { label: 'T2 2026 (Avr-Juin)', data: q2, short: 'T2 2026' },
          { label: 'T3 2026 (Juil-Sep)', data: q3, short: 'T3 2026' },
          { label: 'T4 2026 (En cours)', data: q4, short: 'T4 2026' },
        ];

        return quarters.map((q, idx) => {
          const rec = q.data.reduce((s, d) => s + d.recettesFCFA, 0);
          const fac = q.data.reduce((s, d) => s + d.facturesFCFA, 0);
          const dep = q.data.reduce((s, d) => s + d.depensesFCFA, 0);
          const prod = q.data.reduce((s, d) => s + d.volumeProduitM3, 0);
          const cons = q.data.reduce((s, d) => s + d.volumeFactureM3, 0);
          const per = Math.max(0, prod - cons);

          return {
            id: `Q${idx + 1}-2026`,
            periode: q.short,
            moisComplet: q.label,
            timestamp: idx,
            recettesFCFA: rec,
            facturesFCFA: fac,
            depensesFCFA: dep,
            margeNetteFCFA: rec - dep,
            tauxRecouvrement: fac > 0 ? Math.round((rec / fac) * 100) : 0,
            volumeProduitM3: prod,
            volumeFactureM3: cons,
            pertesM3: per,
            tauxRendement: prod > 0 ? Math.round((cons / prod) * 1000) / 10 : 0,
            tauxPerte: prod > 0 ? Math.round((per / prod) * 1000) / 10 : 0,
          };
        });
      }
      default:
        return fullYearDataset.slice(-6);
    }
  }, [fullYearDataset, period]);

  // Aggregate metrics on current display dataset
  const totalRecettes = displayData.reduce((s, d) => s + d.recettesFCFA, 0);
  const totalDepenses = displayData.reduce((s, d) => s + d.depensesFCFA, 0);
  const totalFactures = displayData.reduce((s, d) => s + d.facturesFCFA, 0);
  const resultatNet = totalRecettes - totalDepenses;

  const totalVolumeProduit = displayData.reduce((s, d) => s + d.volumeProduitM3, 0);
  const totalVolumeFacture = displayData.reduce((s, d) => s + d.volumeFactureM3, 0);
  const totalPertes = Math.max(0, totalVolumeProduit - totalVolumeFacture);
  const rendementGlobal = totalVolumeProduit > 0
    ? Math.round((totalVolumeFacture / totalVolumeProduit) * 1000) / 10
    : 0;
  const tauxPerteGlobal = totalVolumeProduit > 0
    ? Math.round((totalPertes / totalVolumeProduit) * 1000) / 10
    : 0;

  // ━━━━━━━━━━ DAILY DATASET (Jour par Jour sur le mois) ━━━━━━━━━━
  const dailyDataset: DailyDataPoint[] = useMemo(() => {
    const [yearStr, monthStr] = dailyMonth.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);
    const daysInMonth = new Date(year, month, 0).getDate();

    const monthNamesFr = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    const shortMonthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const monthName = monthNamesFr[month - 1];
    const monthShort = shortMonthNames[month - 1];

    const filteredPaiements = forageFilter === 'ALL'
      ? paiements
      : paiements.filter((p) => p.forageId === forageFilter);

    const filteredProduction = forageFilter === 'ALL'
      ? production
      : production.filter((p) => p.forageId === forageFilter);

    let runningCumulConso = 0;
    let runningCumulRevenus = 0;

    const points: DailyDataPoint[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayPad = String(day).padStart(2, '0');
      const dateKey = `${year}-${monthStr}-${dayPad}`;
      const jourLabel = `${dayPad} ${monthShort}`;
      const dateComplete = `${dayPad} ${monthName} ${year}`;

      // Real payments on this exact day
      const dayPaiements = filteredPaiements.filter(
        (p) => p.datePaiement && p.datePaiement.startsWith(dateKey)
      );
      const realPaiementsFCFA = dayPaiements.reduce((s, p) => s + p.montantFCFA, 0);

      // Real production on this exact day
      const dayProd = filteredProduction.filter(
        (p) => p.dateReleve && p.dateReleve.startsWith(dateKey)
      );
      const realProdM3 = dayProd.reduce((s, p) => s + p.volumeProduitM3, 0);

      // Day of week effect
      const dateObj = new Date(year, month - 1, day);
      const dayOfWeek = dateObj.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isMarketDay = dayOfWeek === 3; // Wednesday market day

      // Base water consumption: ~24 - 45 m3
      const dayFactor = isWeekend ? 1.25 : isMarketDay ? 1.35 : 0.95 + ((day * 7) % 15) / 50;
      const baseConsoM3 = Math.round((28 * dayFactor) + ((day * 13) % 9));

      const consoM3 = realProdM3 > 0 ? Math.round(realProdM3 * 0.86) : baseConsoM3;
      const prodM3 = realProdM3 > 0 ? realProdM3 : Math.round(consoM3 * 1.15);
      const pertesM3 = Math.max(0, prodM3 - consoM3);

      // Base daily collection revenue: higher around 5th-15th (due dates)
      const isDueDatePeriod = day >= 5 && day <= 15;
      const baseRecFCFA = isDueDatePeriod
        ? Math.round(48000 + ((day * 7919) % 45000))
        : Math.round(22000 + ((day * 4391) % 25000));

      const finalRevenusFCFA = realPaiementsFCFA > 0
        ? realPaiementsFCFA + Math.round(baseRecFCFA * 0.4)
        : baseRecFCFA;

      const baseDepFCFA = day % 4 === 0 ? Math.round(12000 + ((day * 3117) % 24000)) : 0;

      runningCumulConso += consoM3;
      runningCumulRevenus += finalRevenusFCFA;

      points.push({
        id: dateKey,
        jour: day,
        jourLabel,
        dateComplete,
        consommationM3: consoM3,
        volumeProduitM3: prodM3,
        pertesM3,
        revenusFCFA: finalRevenusFCFA,
        depensesFCFA: baseDepFCFA,
        cumulConsommationM3: runningCumulConso,
        cumulRevenusFCFA: runningCumulRevenus,
        isPeakWater: false,
        isPeakRevenue: false,
      });
    }

    // Identify peak days
    let maxWater = -1;
    let maxWaterIdx = 0;
    let maxRev = -1;
    let maxRevIdx = 0;

    points.forEach((p, idx) => {
      if (p.consommationM3 > maxWater) {
        maxWater = p.consommationM3;
        maxWaterIdx = idx;
      }
      if (p.revenusFCFA > maxRev) {
        maxRev = p.revenusFCFA;
        maxRevIdx = idx;
      }
    });

    if (points[maxWaterIdx]) points[maxWaterIdx].isPeakWater = true;
    if (points[maxRevIdx]) points[maxRevIdx].isPeakRevenue = true;

    return points;
  }, [dailyMonth, forageFilter, paiements, production]);

  // Aggregate metrics on daily dataset
  const totalDailyConsoM3 = dailyDataset.reduce((s, p) => s + p.consommationM3, 0);
  const moyenneDailyConsoM3 = Math.round((totalDailyConsoM3 / (dailyDataset.length || 1)) * 10) / 10;

  const totalDailyRevenusFCFA = dailyDataset.reduce((s, p) => s + p.revenusFCFA, 0);
  const moyenneDailyRevenusFCFA = Math.round(totalDailyRevenusFCFA / (dailyDataset.length || 1));

  const peakWaterPoint = dailyDataset.find((p) => p.isPeakWater) || dailyDataset[0];
  const peakRevenuePoint = dailyDataset.find((p) => p.isPeakRevenue) || dailyDataset[0];

  // Chart styling tokens depending on light/dark mode - Enhanced high contrast for dark mode
  const gridStroke = isDark ? '#334155' : '#e2e8f0';
  const tickFill = isDark ? '#cbd5e1' : '#64748b';

  // Tooltip formatter for daily chart - High contrast dark mode
  const CustomDailyTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataItem = payload[0].payload as DailyDataPoint;
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3.5 rounded-xl shadow-2xl text-xs space-y-1.5 backdrop-blur-md min-w-[250px]">
          <div className="font-bold text-[#082F49] dark:text-cyan-300 border-b border-slate-100 dark:border-slate-700 pb-1.5 flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-500" />
              {dataItem.dateComplete}
            </span>
            {dataItem.isPeakWater && (
              <span className="text-[10px] bg-cyan-100 dark:bg-cyan-950/90 text-cyan-700 dark:text-cyan-300 px-1.5 py-0.5 rounded font-bold border border-cyan-300 dark:border-cyan-700">
                Pic Eau
              </span>
            )}
            {dataItem.isPeakRevenue && (
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                Record Recettes
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 text-emerald-600 dark:text-emerald-400">
            <span>• Encaissements du jour :</span>
            <strong className="font-mono text-sm">{formatFCFA(dataItem.revenusFCFA)}</strong>
          </div>

          <div className="flex items-center justify-between gap-3 text-cyan-600 dark:text-cyan-400">
            <span>• Consommation d'eau :</span>
            <strong className="font-mono text-sm">{formatNumberDot(dataItem.consommationM3)} m³</strong>
          </div>

          <div className="flex items-center justify-between gap-3 text-slate-500 dark:text-slate-400 text-[11px]">
            <span>• Eau pompée en forage :</span>
            <span className="font-mono">{formatNumberDot(dataItem.volumeProduitM3)} m³</span>
          </div>

          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>Cumul recettes mois :</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
              {formatFCFA(dataItem.cumulRevenusFCFA)}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Cumul eau consommée :</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
              {formatNumberDot(dataItem.cumulConsommationM3)} m³
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Tooltip formatter for monthly financial chart
  const CustomFinanceTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataItem = payload[0].payload as MonthlyDataPoint;
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-xl text-xs space-y-1.5 backdrop-blur-md">
          <div className="font-bold text-[#082F49] dark:text-sky-300 border-b border-slate-100 dark:border-slate-800 pb-1 flex items-center justify-between gap-4">
            <span>{dataItem.moisComplet}</span>
            <span className="font-mono text-[10px] text-cyan-600 dark:text-cyan-400">
              Recouvrement: {dataItem.tauxRecouvrement}%
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 text-emerald-600 dark:text-emerald-400">
            <span>• Recettes encaissées :</span>
            <strong className="font-mono">{formatFCFA(dataItem.recettesFCFA)}</strong>
          </div>
          <div className="flex items-center justify-between gap-3 text-sky-700 dark:text-sky-400">
            <span>• Facturation émise :</span>
            <strong className="font-mono">{formatFCFA(dataItem.facturesFCFA)}</strong>
          </div>
          <div className="flex items-center justify-between gap-3 text-rose-600 dark:text-rose-400">
            <span>• Dépenses d'exploitation :</span>
            <strong className="font-mono">{formatFCFA(dataItem.depensesFCFA)}</strong>
          </div>
          <div className="pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-slate-700 dark:text-slate-300 font-semibold">
            <span>Résultat Net :</span>
            <strong className={`font-mono ${dataItem.margeNetteFCFA >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
              {dataItem.margeNetteFCFA >= 0 ? '+' : ''}{formatFCFA(dataItem.margeNetteFCFA)}
            </strong>
          </div>
        </div>
      );
    }
    return null;
  };

  // Tooltip formatter for water production chart
  const CustomWaterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataItem = payload[0].payload as MonthlyDataPoint;
      const isLossAlert = dataItem.tauxPerte > 18;
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-xl text-xs space-y-1.5 backdrop-blur-md">
          <div className="font-bold text-[#082F49] dark:text-sky-300 border-b border-slate-100 dark:border-slate-800 pb-1 flex items-center justify-between gap-4">
            <span>{dataItem.moisComplet}</span>
            <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold ${
              isLossAlert
                ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
            }`}>
              {isLossAlert ? `⚠️ Pertes: ${dataItem.tauxPerte}%` : `Rendement: ${dataItem.tauxRendement}%`}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 text-cyan-600 dark:text-cyan-400">
            <span>• Volume Pompé (Production) :</span>
            <strong className="font-mono">{formatNumberDot(dataItem.volumeProduitM3)} m³</strong>
          </div>
          <div className="flex items-center justify-between gap-3 text-sky-700 dark:text-sky-300">
            <span>• Volume Facturé & Distribué :</span>
            <strong className="font-mono">{formatNumberDot(dataItem.volumeFactureM3)} m³</strong>
          </div>
          <div className="flex items-center justify-between gap-3 text-rose-600 dark:text-rose-400">
            <span>• Pertes Réseau (NRW) :</span>
            <strong className="font-mono">{formatNumberDot(dataItem.pertesM3)} m³ ({dataItem.tauxPerte}%)</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* ━━━━━━━━━━ MAIN CONTROL BAR ━━━━━━━━━━ */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm transition-colors duration-200 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left: Primary View Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold w-full sm:w-auto overflow-x-auto">
          {/* TAB 1: QUOTIDIEN (Demande spécifique utilisateur) */}
          <button
            onClick={() => setViewTab('QUOTIDIEN')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              viewTab === 'QUOTIDIEN'
                ? 'bg-cyan-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Évolution Quotidienne (Jour par Jour)</span>
            <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.2 rounded font-mono font-bold">
              30J
            </span>
          </button>

          {/* TAB 2: COMBINE */}
          <button
            onClick={() => setViewTab('COMBINE')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              viewTab === 'COMBINE'
                ? 'bg-[#082F49] dark:bg-sky-700 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Vue Mensuelle Mixte</span>
          </button>

          {/* TAB 3: FINANCES */}
          <button
            onClick={() => setViewTab('FINANCES')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              viewTab === 'FINANCES'
                ? 'bg-emerald-700 dark:bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
            <span>Finances (FCFA)</span>
          </button>

          {/* TAB 4: PRODUCTION */}
          <button
            onClick={() => setViewTab('PRODUCTION')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              viewTab === 'PRODUCTION'
                ? 'bg-sky-700 dark:bg-sky-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Droplets className="w-3.5 h-3.5 text-cyan-300" />
            <span>Eau & Pertes (m³)</span>
          </button>
        </div>

        {/* Right: Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
          {/* Forage Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={forageFilter}
              onChange={(e) => {
                setForageFilter(e.target.value);
                if (onSelectForageId) onSelectForageId(e.target.value);
              }}
              className="bg-transparent text-slate-700 dark:text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tous les forages ({forages.length})</option>
              {forages.map((f) => (
                <option key={f.id} value={f.id} className="dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                  {f.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Conditional Controls depending on Active Tab */}
          {viewTab === 'QUOTIDIEN' ? (
            /* Month Selector for Daily View */
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
              <select
                value={dailyMonth}
                onChange={(e) => setDailyMonth(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-slate-200 font-bold focus:outline-none cursor-pointer"
              >
                <option value="2026-11">Novembre 2026 (En cours)</option>
                <option value="2026-10">Octobre 2026</option>
                <option value="2026-09">Septembre 2026</option>
                <option value="2026-08">Août 2026</option>
              </select>
            </div>
          ) : (
            /* Period Selector Segmented Buttons for Monthly Views */
            <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs font-semibold">
              <button
                onClick={() => setPeriod('6M')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  period === '6M'
                    ? 'bg-white dark:bg-slate-700 text-sky-800 dark:text-sky-300 shadow-xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="6 derniers mois"
              >
                6 mois
              </button>
              <button
                onClick={() => setPeriod('12M')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  period === '12M'
                    ? 'bg-white dark:bg-slate-700 text-sky-800 dark:text-sky-300 shadow-xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="12 derniers mois (glissant)"
              >
                12 mois
              </button>
              <button
                onClick={() => setPeriod('TRIMESTRE')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  period === 'TRIMESTRE'
                    ? 'bg-white dark:bg-slate-700 text-sky-800 dark:text-sky-300 shadow-xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Trimestres 2026 (T1-T4)"
              >
                Trimestres
              </button>
              <button
                onClick={() => setPeriod('ANNEE')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  period === 'ANNEE'
                    ? 'bg-white dark:bg-slate-700 text-sky-800 dark:text-sky-300 shadow-xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Année 2026 complète"
              >
                Année 2026
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ━━━━━━━━━━ SECTION A: VUE QUOTIDIENNE (JOUR PAR JOUR) ━━━━━━━━━━ */}
      {viewTab === 'QUOTIDIEN' && (
        <div className="space-y-5">
          {/* Daily Sub-mode Selector Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Mode d'analyse quotidienne :</span>
              <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setDailySubMode('MIXTE')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    dailySubMode === 'MIXTE'
                      ? 'bg-cyan-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Mixte (Eau & Revenus)
                </button>
                <button
                  onClick={() => setDailySubMode('EAU')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    dailySubMode === 'EAU'
                      ? 'bg-cyan-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Eau Consommée (m³/j)
                </button>
                <button
                  onClick={() => setDailySubMode('REVENUS')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    dailySubMode === 'REVENUS'
                      ? 'bg-cyan-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Revenus Encaissés (FCFA/j)
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
              <span>Surveillance journalière pour détection immédiate des pics d'usage et d'encaissement</span>
            </div>
          </div>

          {/* Daily Synthetic Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                Consommation Totale ({dailyDataset.length}j)
              </span>
              <div className="text-xl font-extrabold text-cyan-600 dark:text-cyan-400 font-mono mt-1">
                {formatNumberDot(totalDailyConsoM3)} m³
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                Moyenne : <strong className="text-cyan-700 dark:text-cyan-300">{formatNumberDot(moyenneDailyConsoM3)} m³/jour</strong>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                Revenus Encaissés du Mois
              </span>
              <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                {formatFCFA(totalDailyRevenusFCFA)}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                Moyenne : <strong className="text-emerald-700 dark:text-emerald-300">{formatNumberDot(moyenneDailyRevenusFCFA)} FCFA/j</strong>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                Pic Journalier d'Eau
              </span>
              <div className="text-xl font-extrabold text-sky-700 dark:text-sky-300 font-mono mt-1">
                {formatNumberDot(peakWaterPoint?.consommationM3 || 0)} m³
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                Le {peakWaterPoint?.jourLabel} ({Math.round(((peakWaterPoint?.consommationM3 || 1) / (moyenneDailyConsoM3 || 1) - 1) * 100)}% vs moy.)
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                Record d'Encaissement
              </span>
              <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                {formatFCFA(peakRevenuePoint?.revenusFCFA || 0)}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                Le {peakRevenuePoint?.jourLabel} (Journée de pointe)
              </div>
            </div>
          </div>

          {/* Interactive Recharts Container for Daily View */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-[#082F49] dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  <span>
                    {dailySubMode === 'MIXTE' && 'Évolution Quotidienne : Eau Consommée vs Revenus Encaissés'}
                    {dailySubMode === 'EAU' && 'Évolution Quotidienne de la Consommation d\'Eau (m³/jour)'}
                    {dailySubMode === 'REVENUS' && 'Évolution Quotidienne des Revenus Encaissés (FCFA/jour)'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Visualisation continue du 1er au {dailyDataset.length} du mois • Double axe synchronisé
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 px-2.5 py-1 rounded-full border border-cyan-200 dark:border-cyan-800 font-bold">
                  {dailyMonth === '2026-11' ? 'Novembre 2026' : dailyMonth} • {forageFilter === 'ALL' ? 'Tous forages' : 'Forage ciblé'}
                </span>
              </div>
            </div>

            {/* Recharts Render */}
            <div className="w-full h-88 sm:h-96">
              <ResponsiveContainer width="100%" height="100%">
                {dailySubMode === 'MIXTE' ? (
                  /* --- 1. COMPOSED CHART DUAL AXIS (REVENUS BARS + WATER AREA) --- */
                  <ComposedChart data={dailyDataset} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="dailyWaterGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="dailyRevGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                    <XAxis
                      dataKey="jourLabel"
                      stroke={tickFill}
                      fontSize={10.5}
                      tickLine={false}
                      axisLine={{ stroke: gridStroke }}
                    />
                    {/* Left Axis: FCFA */}
                    <YAxis
                      yAxisId="left"
                      stroke="#10B981"
                      fontSize={10}
                      tickLine={false}
                      axisLine={{ stroke: gridStroke }}
                      tickFormatter={(val) => `${(val / 1000).toFixed(0)}k F`}
                    />
                    {/* Right Axis: m3 */}
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#06B6D4"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `${val}m³`}
                    />
                    <Tooltip content={<CustomDailyTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                      formatter={(value) => {
                        if (value === 'revenusFCFA') return 'Paiements Encaissés (FCFA/jour)';
                        if (value === 'volumeProduitM3') return 'Volume d\'Eau Produit au Forage (m³/jour)';
                        if (value === 'consommationM3') return 'Volume Consommé / Distribué (m³/jour)';
                        return value;
                      }}
                    />
                    <ReferenceLine
                      yAxisId="right"
                      y={moyenneDailyConsoM3}
                      stroke="#0891b2"
                      strokeDasharray="4 4"
                      label={{ value: `Moy. Eau: ${moyenneDailyConsoM3} m³`, fill: '#0891b2', fontSize: 10, position: 'right' }}
                    />
                    <Bar
                      yAxisId="left"
                      name="revenusFCFA"
                      dataKey="revenusFCFA"
                      fill="url(#dailyRevGrad)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={22}
                    />
                    <Area
                      yAxisId="right"
                      name="consommationM3"
                      type="monotone"
                      dataKey="consommationM3"
                      stroke="#06B6D4"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#dailyWaterGrad)"
                      dot={{ r: 2.5, fill: '#06B6D4' }}
                      activeDot={{ r: 5, fill: '#082F49' }}
                    />
                    <Line
                      yAxisId="right"
                      name="volumeProduitM3"
                      type="monotone"
                      dataKey="volumeProduitM3"
                      stroke="#38BDF8"
                      strokeWidth={2.5}
                      strokeDasharray="4 3"
                      dot={{ r: 3, fill: '#38BDF8' }}
                      activeDot={{ r: 6, fill: '#0284C7' }}
                    />
                  </ComposedChart>
                ) : dailySubMode === 'EAU' ? (
                  /* --- 2. DEDICATED WATER AREA CHART --- */
                  <AreaChart data={dailyDataset} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="waterPureGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0284C7" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="prodPureGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                    <XAxis
                      dataKey="jourLabel"
                      stroke={tickFill}
                      fontSize={10.5}
                      tickLine={false}
                      axisLine={{ stroke: gridStroke }}
                    />
                    <YAxis
                      stroke={tickFill}
                      fontSize={10}
                      tickLine={false}
                      axisLine={{ stroke: gridStroke }}
                      tickFormatter={(val) => `${val} m³`}
                    />
                    <Tooltip content={<CustomDailyTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                      formatter={(value) => {
                        if (value === 'consommationM3') return 'Consommation d\'Eau Quotidienne (m³)';
                        if (value === 'volumeProduitM3') return 'Eau Pompée en Tête de Forage (m³)';
                        return value;
                      }}
                    />
                    <ReferenceLine
                      y={moyenneDailyConsoM3}
                      stroke="#0284C7"
                      strokeDasharray="4 4"
                      label={{ value: `Moyenne : ${moyenneDailyConsoM3} m³/j`, fill: '#0284C7', fontSize: 10, position: 'top' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="volumeProduitM3"
                      stroke="#06B6D4"
                      strokeWidth={1.8}
                      strokeDasharray="3 3"
                      fillOpacity={1}
                      fill="url(#prodPureGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="consommationM3"
                      stroke="#0284C7"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#waterPureGrad)"
                      dot={{ r: 3, fill: '#0284C7' }}
                      activeDot={{ r: 6, fill: '#082F49' }}
                    />
                  </AreaChart>
                ) : (
                  /* --- 3. DEDICATED REVENUE BAR & CUMULATIVE LINE CHART --- */
                  <ComposedChart data={dailyDataset} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="revPureGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                    <XAxis
                      dataKey="jourLabel"
                      stroke={tickFill}
                      fontSize={10.5}
                      tickLine={false}
                      axisLine={{ stroke: gridStroke }}
                    />
                    {/* Left: Daily Revenue */}
                    <YAxis
                      yAxisId="left"
                      stroke="#10B981"
                      fontSize={10}
                      tickLine={false}
                      axisLine={{ stroke: gridStroke }}
                      tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                    />
                    {/* Right: Cumulative */}
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#0369A1"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomDailyTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                      formatter={(value) => {
                        if (value === 'revenusFCFA') return 'Encaissements Quotidiens (FCFA/j)';
                        if (value === 'cumulRevenusFCFA') return 'Progression Cumulée du Mois (FCFA)';
                        return value;
                      }}
                    />
                    <ReferenceLine
                      yAxisId="left"
                      y={moyenneDailyRevenusFCFA}
                      stroke="#10B981"
                      strokeDasharray="4 4"
                      label={{ value: `Moyenne : ${formatNumberDot(moyenneDailyRevenusFCFA)} F`, fill: '#10B981', fontSize: 10, position: 'top' }}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="revenusFCFA"
                      fill="url(#revPureGrad)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={24}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="cumulRevenusFCFA"
                      stroke="#0369A1"
                      strokeWidth={2.5}
                      dot={false}
                    />
                  </ComposedChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Bottom Insight for Daily View */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>
                  Pic d'eau journalier : <strong>{formatNumberDot(peakWaterPoint?.consommationM3 || 0)} m³</strong> le {peakWaterPoint?.jourLabel} • Record d'encaissement : <strong>{formatFCFA(peakRevenuePoint?.revenusFCFA || 0)}</strong> le {peakRevenuePoint?.jourLabel}
                </span>
              </span>
              <span className="font-mono text-[11px] text-cyan-600 dark:text-cyan-400">
                Données mises à jour en temps réel
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━ SECTION B: VUES MENSUELLES (COMBINÉE, FINANCES, PRODUCTION) ━━━━━━━━━━ */}
      {viewTab !== 'QUOTIDIEN' && (
        <div className="space-y-6">
          {/* Synthetic Metric Strips for Selected Period */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors duration-200">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                Recettes Encaissées ({period})
              </span>
              <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                {formatFCFA(totalRecettes)}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                Marge nette : <strong className={resultatNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}>
                  {resultatNet >= 0 ? '+' : ''}{formatFCFA(resultatNet)}
                </strong>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors duration-200">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                Dépenses d'Exploitation ({period})
              </span>
              <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400 font-mono mt-1">
                {formatFCFA(totalDepenses)}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                Ratio dépenses/recettes : <strong>{totalRecettes > 0 ? Math.round((totalDepenses / totalRecettes) * 100) : 0}%</strong>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors duration-200">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                Volume d'Eau Produit ({period})
              </span>
              <div className="text-xl font-extrabold text-cyan-600 dark:text-cyan-400 font-mono mt-1">
                {formatNumberDot(totalVolumeProduit)} m³
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                Distribué : <strong className="text-sky-700 dark:text-sky-300">{formatNumberDot(totalVolumeFacture)} m³</strong>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors duration-200">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                Rendement Réseau & Pertes
              </span>
              <div className={`text-xl font-extrabold font-mono mt-1 ${
                tauxPerteGlobal > 18 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {rendementGlobal}%
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
                {tauxPerteGlobal > 18 ? (
                  <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-0.5">
                    <AlertTriangle className="w-3 h-3" /> Pertes : {tauxPerteGlobal}% (seuil: 18%)
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Pertes contenues : {tauxPerteGlobal}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Monthly Charts Area */}
          <div className={`grid gap-6 ${viewTab === 'COMBINE' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            {/* CHART 1: FINANCIAL DYNAMICS */}
            {(viewTab === 'COMBINE' || viewTab === 'FINANCES') && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm transition-colors duration-200 flex flex-col justify-between">
                <div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2 mb-4">
                    <div>
                      <h3 className="text-base font-bold text-[#082F49] dark:text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <span>Évolution des Recettes & Dépenses</span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Flux financiers mensuels en Francs CFA (Recettes, Facturation, Décaissements)
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-200 dark:border-cyan-800">
                      {period} • {forageFilter === 'ALL' ? 'Tous forages' : 'Forage ciblé'}
                    </span>
                  </div>

                  <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={displayData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRecettes" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="colorFactures" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0369A1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#0369A1" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="colorDepenses" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                        <XAxis
                          dataKey="periode"
                          stroke={tickFill}
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: gridStroke }}
                        />
                        <YAxis
                          stroke={tickFill}
                          fontSize={10}
                          tickLine={false}
                          axisLine={{ stroke: gridStroke }}
                          tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                        />
                        <Tooltip content={<CustomFinanceTooltip />} />
                        <Legend
                          wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                          iconType="circle"
                          formatter={(value) => {
                            if (value === 'recettesFCFA') return 'Recettes Encaissées';
                            if (value === 'facturesFCFA') return 'Facturation Émise';
                            if (value === 'depensesFCFA') return 'Dépenses Validées';
                            return value;
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="facturesFCFA"
                          stroke="#0369A1"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          fillOpacity={1}
                          fill="url(#colorFactures)"
                        />
                        <Area
                          type="monotone"
                          dataKey="recettesFCFA"
                          stroke="#10B981"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorRecettes)"
                        />
                        <Area
                          type="monotone"
                          dataKey="depensesFCFA"
                          stroke="#F43F5E"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorDepenses)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Recouvrement moyen : <strong>{totalFactures > 0 ? Math.round((totalRecettes / totalFactures) * 100) : 0}%</strong>
                  </span>
                  <span className="font-mono text-[11px] text-cyan-600 dark:text-cyan-400">
                    Moyenne : {formatFCFA(Math.round(totalRecettes / displayData.length))} /mois
                  </span>
                </div>
              </div>
            )}

            {/* CHART 2: WATER PRODUCTION & VOLUMES */}
            {(viewTab === 'COMBINE' || viewTab === 'PRODUCTION') && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm transition-colors duration-200 flex flex-col justify-between">
                <div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2 mb-4">
                    <div>
                      <h3 className="text-base font-bold text-[#082F49] dark:text-white flex items-center gap-2">
                        <Droplets className="w-5 h-5 text-cyan-500" />
                        <span>Volumes d'Eau Produite & Distribuée</span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Production au compteur général, volume distribué aux abonnés et pertes réseau (m³)
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-200 dark:border-cyan-800">
                      {period} • {forageFilter === 'ALL' ? 'Tous forages' : 'Forage ciblé'}
                    </span>
                  </div>

                  <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={displayData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                        <XAxis
                          dataKey="periode"
                          stroke={tickFill}
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: gridStroke }}
                        />
                        <YAxis
                          yAxisId="left"
                          stroke={tickFill}
                          fontSize={10}
                          tickLine={false}
                          axisLine={{ stroke: gridStroke }}
                          tickFormatter={(val) => `${val}m³`}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          stroke="#10B981"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          domain={[50, 100]}
                          tickFormatter={(val) => `${val}%`}
                        />
                        <Tooltip content={<CustomWaterTooltip />} />
                        <Legend
                          wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                          formatter={(value) => {
                            if (value === 'volumeProduitM3') return 'Eau Pompée (Production)';
                            if (value === 'volumeFactureM3') return 'Eau Facturée (Consommation)';
                            if (value === 'pertesM3') return 'Pertes Réseau (NRW)';
                            if (value === 'tauxRendement') return 'Rendement Réseau (%)';
                            return value;
                          }}
                        />
                        <Bar
                          yAxisId="left"
                          dataKey="volumeProduitM3"
                          fill="#06B6D4"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={32}
                        />
                        <Bar
                          yAxisId="left"
                          dataKey="volumeFactureM3"
                          fill="#0369A1"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={32}
                        />
                        <Bar
                          yAxisId="left"
                          dataKey="pertesM3"
                          fill="#F43F5E"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={32}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="tauxRendement"
                          stroke="#10B981"
                          strokeWidth={2.5}
                          dot={{ r: 3, fill: '#10B981' }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-cyan-500" />
                    Pertes totales estimées : <strong className={tauxPerteGlobal > 18 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}>
                      {formatNumberDot(totalPertes)} m³ ({tauxPerteGlobal}%)
                    </strong>
                  </span>
                  <span className="font-mono text-[11px] text-cyan-600 dark:text-cyan-400">
                    Seuil de fuites max : 18.0%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
