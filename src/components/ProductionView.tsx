import React, { useState, useEffect, useMemo } from 'react';
import {
  Droplets,
  Plus,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Gauge,
  TrendingDown,
  TrendingUp,
  Activity,
  Layers,
  Calendar,
  Boxes,
  ShieldAlert,
  Wrench,
  Settings2,
  ArrowDownRight,
  ArrowUpRight,
  Send,
  PhoneCall,
  Truck,
  Building2,
  Clock,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  History,
  BellRing,
  Filter,
  PackageCheck,
  Check,
  X,
  Smartphone,
  Eye,
} from 'lucide-react';
import { store } from '../services/store';
import {
  ReleveProduction,
  Forage,
  StockItem,
  MouvementStock,
  AlerteStockNotification,
  CategorieArticleStock,
  StatutNiveauStock,
} from '../types';
import { formatNumberDot } from '../utils/formatters';

type TabView = 'PRODUCTION' | 'STOCKS';
type StockCategoryFilter = 'TOUS' | CategorieArticleStock;
type StockStatusFilter = 'TOUS' | StatutNiveauStock;

export const ProductionView: React.FC = () => {
  // Navigation tab
  const [activeTab, setActiveTab] = useState<TabView>('PRODUCTION');

  // Production State
  const [production, setProduction] = useState<ReleveProduction[]>(store.getProduction());
  const [forages, setForages] = useState<Forage[]>(store.getForages());
  const [selectedForageId, setSelectedForageId] = useState<string>('ALL');
  const [showAddProdModal, setShowAddProdModal] = useState(false);

  // Form state Production
  const [formForageId, setFormForageId] = useState(forages[0]?.id || '');
  const [ancienIndex, setAncienIndex] = useState(45780);
  const [nouvelIndex, setNouvelIndex] = useState(46350);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Stocks State
  const [stocks, setStocks] = useState<StockItem[]>(store.getStocks());
  const [mouvements, setMouvements] = useState<MouvementStock[]>(store.getMouvementsStock());
  const [alertesStock, setAlertesStock] = useState<AlerteStockNotification[]>(store.getAlertesStock());
  const [selectedCategory, setSelectedCategory] = useState<StockCategoryFilter>('TOUS');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<StockStatusFilter>('TOUS');
  const [stockSubTab, setStockSubTab] = useState<'INVENTAIRE' | 'MOUVEMENTS' | 'ALERTES'>('INVENTAIRE');

  // Modals Stock
  const [editingStockItem, setEditingStockItem] = useState<StockItem | null>(null);
  const [movementStockItem, setMovementStockItem] = useState<StockItem | null>(null);
  const [showQuickMovementModal, setShowQuickMovementModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'alert' | 'info' } | null>(null);

  // Form Config Seuils State
  const [formSeuilCritique, setFormSeuilCritique] = useState<number>(0);
  const [formSeuilAlerte, setFormSeuilAlerte] = useState<number>(0);
  const [formNotificationActive, setFormNotificationActive] = useState<boolean>(true);
  const [formDestinataireAlerte, setFormDestinataireAlerte] = useState<string>('');
  const [formFournisseurNom, setFormFournisseurNom] = useState<string>('');
  const [formFournisseurContact, setFormFournisseurContact] = useState<string>('');
  const [formDelaiLivraison, setFormDelaiLivraison] = useState<number>(2);
  const [formEmplacement, setFormEmplacement] = useState<string>('');

  // Form Mouvement Stock State
  const [mvtSelectedStockId, setMvtSelectedStockId] = useState<string>('');
  const [mvtType, setMvtType] = useState<'ENTREE' | 'SORTIE'>('ENTREE');
  const [mvtQuantite, setMvtQuantite] = useState<number>(1);
  const [mvtMotif, setMvtMotif] = useState<string>('');
  const [mvtReferenceBon, setMvtReferenceBon] = useState<string>('');
  const [mvtError, setMvtError] = useState<string | null>(null);

  const currentUser = store.getCurrentUser();

  // Subscribe to store updates
  useEffect(() => {
    return store.subscribe(() => {
      setProduction(store.getProduction());
      setForages(store.getForages());
      setStocks(store.getStocks());
      setMouvements(store.getMouvementsStock());
      setAlertesStock(store.getAlertesStock());
    });
  }, []);

  const triggerToast = (text: string, type: 'success' | 'alert' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  const filterId = selectedForageId === 'ALL' ? undefined : selectedForageId;
  const bilan = store.getBilanProduction(filterId);

  const filteredProduction = selectedForageId === 'ALL'
    ? production
    : production.filter((p) => p.forageId === selectedForageId);

  // Filtered stocks
  const filteredStocks = useMemo(() => {
    return stocks.filter((s) => {
      if (selectedForageId !== 'ALL' && s.forageId && s.forageId !== selectedForageId) {
        return false;
      }
      if (selectedCategory !== 'TOUS' && s.categorie !== selectedCategory) {
        return false;
      }
      if (selectedStatusFilter !== 'TOUS') {
        const statut = store.getStatutNiveauStock(s);
        if (statut !== selectedStatusFilter) return false;
      }
      return true;
    });
  }, [stocks, selectedForageId, selectedCategory, selectedStatusFilter]);

  // Critical items check
  const criticalItems = useMemo(() => {
    return stocks.filter((s) => {
      const statut = store.getStatutNiveauStock(s);
      return statut === 'CRITIQUE' || statut === 'RUPTURE';
    });
  }, [stocks]);

  const alertItems = useMemo(() => {
    return stocks.filter((s) => store.getStatutNiveauStock(s) === 'ALERTE');
  }, [stocks]);

  const canManage = ['ADMIN_ORG', 'ADMIN_FORAGE', 'SUPER_ADMIN'].includes(currentUser.role);
  const canRecordProd = ['ADMIN_ORG', 'ADMIN_FORAGE', 'RELEVEUR', 'SUPER_ADMIN'].includes(currentUser.role);

  // Handlers Production
  const handleSaveProduction = (e: React.FormEvent) => {
    e.preventDefault();
    if (nouvelIndex < ancienIndex) {
      setErrorMessage('Le nouvel index ne peut être inférieur à l’ancien.');
      return;
    }

    const res = store.enregistrerProduction({
      forageId: formForageId,
      ancienIndexM3: Number(ancienIndex),
      nouvelIndexM3: Number(nouvelIndex),
    });

    if (!res.success) {
      setErrorMessage(res.message);
      return;
    }

    setShowAddProdModal(false);
    setErrorMessage(null);
    triggerToast(`Relevé de production enregistré avec succès (+${nouvelIndex - ancienIndex} m³).`, 'success');
  };

  // Open Edit Threshold Modal
  const openEditModal = (stock: StockItem) => {
    setEditingStockItem(stock);
    setFormSeuilCritique(stock.seuilCritique);
    setFormSeuilAlerte(stock.seuilAlerte);
    setFormNotificationActive(stock.notificationActive);
    setFormDestinataireAlerte(stock.destinataireAlerte);
    setFormFournisseurNom(stock.fournisseurNom);
    setFormFournisseurContact(stock.fournisseurContact);
    setFormDelaiLivraison(stock.delaiLivraisonJours);
    setFormEmplacement(stock.emplacement);
  };

  const handleSaveSeuils = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStockItem) return;

    if (formSeuilCritique > formSeuilAlerte) {
      triggerToast('Attention : Le seuil critique est habituellement inférieur ou égal au seuil d’alerte.', 'alert');
    }

    const res = store.updateStockSeuils(editingStockItem.id, {
      seuilCritique: Number(formSeuilCritique),
      seuilAlerte: Number(formSeuilAlerte),
      notificationActive: formNotificationActive,
      destinataireAlerte: formDestinataireAlerte,
      fournisseurNom: formFournisseurNom,
      fournisseurContact: formFournisseurContact,
      delaiLivraisonJours: Number(formDelaiLivraison),
      emplacement: formEmplacement,
    });

    if (res.success) {
      triggerToast(
        `Seuils de sécurité mis à jour pour ${editingStockItem.nom}. Notifications automatiques ${formNotificationActive ? 'activées' : 'désactivées'}.`,
        'success'
      );
      setEditingStockItem(null);
    }
  };

  // Open Movement Modal
  const openMovementModal = (stock?: StockItem) => {
    const target = stock || stocks[0];
    if (target) {
      setMovementStockItem(target);
      setMvtSelectedStockId(target.id);
      setMvtType('ENTREE');
      setMvtQuantite(target.categorie === 'CHLORE' ? 10 : target.categorie === 'COMPTEUR_NEUF' ? 5 : 2);
      setMvtMotif(
        target.categorie === 'CHLORE'
          ? 'Réapprovisionnement bidons chlore désinfection bâche de reprise'
          : target.categorie === 'COMPTEUR_NEUF'
          ? 'Pose nouveaux compteurs et remplacement compteurs vétustes'
          : 'Réception pièces détachées de maintenance préventive'
      );
      setMvtReferenceBon('');
      setMvtError(null);
      setShowQuickMovementModal(true);
    }
  };

  const handleSaveMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = mvtSelectedStockId || movementStockItem?.id;
    if (!targetId) return;

    const targetStock = stocks.find((s) => s.id === targetId);
    if (!targetStock) return;

    if (mvtQuantite <= 0) {
      setMvtError('La quantité doit être supérieure à zéro.');
      return;
    }

    if (mvtType === 'SORTIE' && mvtQuantite > targetStock.quantiteActuelle) {
      setMvtError(`Stock insuffisant. Maximum retirable : ${targetStock.quantiteActuelle} ${targetStock.unite}`);
      return;
    }

    const res = store.enregistrerMouvementStock({
      stockId: targetId,
      type: mvtType,
      quantite: Number(mvtQuantite),
      motif: mvtMotif || (mvtType === 'ENTREE' ? 'Approvisionnement magasin' : 'Utilisation sur réseau'),
      referenceBon: mvtReferenceBon,
    });

    if (res.success) {
      triggerToast(
        `${mvtType === 'ENTREE' ? 'Entrée' : 'Sortie'} de ${mvtQuantite} ${targetStock.unite} enregistrée sur ${targetStock.nom}.`,
        mvtType === 'ENTREE' ? 'success' : 'info'
      );
      setShowQuickMovementModal(false);
      setMvtError(null);
    } else {
      setMvtError(res.message);
    }
  };

  // Dispatch instant test SMS notification
  const handleTestAlert = (stock: StockItem) => {
    const alerte = store.declencherAlerteStockNotification(stock, 'CRITIQUE');
    triggerToast(
      `Alerte critique simulée envoyée avec succès par SMS à ${stock.destinataireAlerte} !`,
      'alert'
    );
  };

  const getCategoryBadge = (cat: CategorieArticleStock) => {
    switch (cat) {
      case 'CHLORE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
            <Droplets className="w-3 h-3" />
            CHLORE & DÉSINFECTION
          </span>
        );
      case 'COMPTEUR_NEUF':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
            <Gauge className="w-3 h-3" />
            COMPTEURS NEUFS
          </span>
        );
      case 'PIECE_DETACHEE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <Wrench className="w-3 h-3" />
            PIÈCES DÉTACHÉES
          </span>
        );
      case 'CARBURANT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300 border border-orange-300 dark:border-orange-800">
            <Activity className="w-3 h-3" />
            CARBURANT & ÉNERGIE
          </span>
        );
      case 'CONSOMMABLE':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <Boxes className="w-3 h-3" />
            CONSOMMABLES
          </span>
        );
    }
  };

  const getStatusBadge = (statut: StatutNiveauStock) => {
    switch (statut) {
      case 'RUPTURE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse shadow-sm">
            <AlertOctagon className="w-3 h-3" />
            RUPTURE TOTALE
          </span>
        );
      case 'CRITIQUE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <ShieldAlert className="w-3 h-3 text-rose-600 animate-bounce" />
            SEUIL CRITIQUE
          </span>
        );
      case 'ALERTE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            ATTENTION STOCK BAS
          </span>
        );
      case 'NORMAL':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            CONFORME
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-xl border text-xs font-semibold flex items-center gap-3 transition-all ${
            toastMessage.type === 'alert'
              ? 'bg-rose-600 text-white border-rose-700 shadow-rose-900/30'
              : toastMessage.type === 'info'
              ? 'bg-sky-700 text-white border-sky-800 shadow-sky-900/30'
              : 'bg-emerald-600 text-white border-emerald-700 shadow-emerald-900/30'
          }`}
        >
          {toastMessage.type === 'alert' ? (
            <AlertTriangle className="w-5 h-5 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 hover:bg-black/20 p-1 rounded-full cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
              Module Opérationnel
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Hydraulique & Logistique ASUFOR
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            {activeTab === 'STOCKS' ? (
              <Boxes className="w-7 h-7 text-cyan-600 dark:text-cyan-400" />
            ) : (
              <Gauge className="w-7 h-7 text-cyan-600 dark:text-cyan-400" />
            )}
            {activeTab === 'STOCKS'
              ? 'Gestion des Stocks & Seuils Critiques'
              : "Production d'Eau & Pertes Réseau (NRW)"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {activeTab === 'STOCKS'
              ? 'Surveillance continue du chlore de traitement, des compteurs divisionnaires et des pièces de sécurité avec alertes SMS d’urgence.'
              : 'Index généraux des têtes de forage, débits de pompage et détection précoce des fuites physiques.'}
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {activeTab === 'STOCKS' && canManage && (
            <>
              <button
                onClick={() => openMovementModal()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <ArrowDownRight className="w-4 h-4" />
                <span>Nouveau mouvement de stock</span>
              </button>

              <button
                onClick={() => openEditModal(stocks[0])}
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Settings2 className="w-4 h-4" />
                <span>Configurer les seuils</span>
              </button>
            </>
          )}

          {activeTab === 'PRODUCTION' && canRecordProd && (
            <button
              onClick={() => setShowAddProdModal(true)}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Relever compteur de production</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Switcher & Location Filter */}
      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('STOCKS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'STOCKS'
                ? 'bg-white dark:bg-slate-900 text-cyan-700 dark:text-cyan-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Stocks & Seuils Critiques</span>
            {criticalItems.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                {criticalItems.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('PRODUCTION')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'PRODUCTION'
                ? 'bg-white dark:bg-slate-900 text-cyan-700 dark:text-cyan-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Gauge className="w-4 h-4" />
            <span>Production & Pertes Réseau</span>
          </button>
        </div>

        {/* Borehole filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Forage :</span>
          <select
            value={selectedForageId}
            onChange={(e) => setSelectedForageId(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="ALL">Tous les forages / Magasin central</option>
            {forages.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nom} ({f.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: GESTION DES STOCKS & SEUILS CRITIQUES                             */}
      {/* ========================================================================= */}
      {activeTab === 'STOCKS' && (
        <div className="space-y-6">
          {/* URGENT CRITICAL ALERT BANNER */}
          {criticalItems.length > 0 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-500/15 via-rose-500/10 to-amber-500/10 border-2 border-rose-500/40 dark:border-rose-500/50 backdrop-blur-sm relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-lg shadow-rose-600/30 shrink-0 mt-0.5">
                    <ShieldAlert className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white">
                        Alerte de Sécurité Immédiate
                      </span>
                      <span className="text-xs font-mono font-bold text-rose-700 dark:text-rose-300">
                        {criticalItems.length} article(s) sous le seuil critique
                      </span>
                    </div>
                    <h3 className="text-base font-black text-rose-950 dark:text-rose-100 mt-1">
                      Risque d'interruption du service d'eau ou de potabilisation !
                    </h3>
                    <p className="text-xs text-rose-900/80 dark:text-rose-200/90 mt-1 max-w-2xl">
                      {criticalItems.map((c) => `${c.nom} (${c.quantiteActuelle} ${c.unite} restants / Seuil critique: ${c.seuilCritique} ${c.unite})`).join(' • ')}
                      . Des SMS d'urgence ont été automatiquement transmis aux contacts d'astreinte technique.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => openMovementModal(criticalItems[0])}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowDownRight className="w-4 h-4" />
                    <span>Réceptionner commande d'urgence</span>
                  </button>
                  <button
                    onClick={() => openEditModal(criticalItems[0])}
                    className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Settings2 className="w-4 h-4" />
                    <span>Ajuster seuils</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                <span>Articles suivis</span>
                <Boxes className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                {stocks.length}
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Chlore, pièces, compteurs, huiles
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                <span>Niveau Critique / Rupture</span>
                <ShieldAlert className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-2">
                {criticalItems.length}
                {criticalItems.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold">
                    Action requise
                  </span>
                )}
              </div>
              <div className="text-[11px] text-rose-500/80 mt-0.5">Sous le seuil minimum légal</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                <span>Niveau Alerte Basse</span>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {alertItems.length}
              </div>
              <div className="text-[11px] text-amber-500/80 mt-0.5">Commander réapprovisionnement</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                <span>Alertes SMS configurées</span>
                <BellRing className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {stocks.filter((s) => s.notificationActive).length} / {stocks.length}
              </div>
              <div className="text-[11px] text-emerald-500/80 mt-0.5">Passerelle SMS active</div>
            </div>
          </div>

          {/* Sub-Tabs: Inventaire vs Mouvements vs Alertes */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStockSubTab('INVENTAIRE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  stockSubTab === 'INVENTAIRE'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>Articles & Seuils Critiques ({filteredStocks.length})</span>
              </button>

              <button
                onClick={() => setStockSubTab('MOUVEMENTS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  stockSubTab === 'MOUVEMENTS'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Journal des Mouvements ({mouvements.length})</span>
              </button>

              <button
                onClick={() => setStockSubTab('ALERTES')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  stockSubTab === 'ALERTES'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>Alertes Automatiques Déclenchées ({alertesStock.length})</span>
              </button>
            </div>

            {/* Category & Status Quick Filters (when on INVENTAIRE) */}
            {stockSubTab === 'INVENTAIRE' && (
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as StockCategoryFilter)}
                  className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="TOUS">Toutes catégories</option>
                  <option value="CHLORE">Chlore & Désinfection</option>
                  <option value="COMPTEUR_NEUF">Compteurs Neufs</option>
                  <option value="PIECE_DETACHEE">Pièces Détachées</option>
                  <option value="CARBURANT">Carburant</option>
                  <option value="CONSOMMABLE">Consommables</option>
                </select>

                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value as StockStatusFilter)}
                  className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="TOUS">Tous les états</option>
                  <option value="CRITIQUE">Seuil critique uniquement</option>
                  <option value="ALERTE">Alerte basse uniquement</option>
                  <option value="NORMAL">Normal uniquement</option>
                </select>
              </div>
            )}
          </div>

          {/* SUB-VIEW 1: INVENTAIRE DES ARTICLES ET SEUILS */}
          {stockSubTab === 'INVENTAIRE' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredStocks.map((stock) => {
                  const statut = store.getStatutNiveauStock(stock);
                  const isCritique = statut === 'CRITIQUE' || statut === 'RUPTURE';
                  const isAlerte = statut === 'ALERTE';

                  // Calculate percentage relative to alert threshold (max representation 150%)
                  const referenceMax = Math.max(stock.seuilAlerte * 1.5, stock.seuilCritique * 2, stock.quantiteActuelle * 1.2, 10);
                  const currentPercent = Math.min(100, Math.round((stock.quantiteActuelle / referenceMax) * 100));
                  const critiquePercent = Math.min(100, Math.round((stock.seuilCritique / referenceMax) * 100));
                  const alertePercent = Math.min(100, Math.round((stock.seuilAlerte / referenceMax) * 100));

                  return (
                    <div
                      key={stock.id}
                      className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 shadow-sm overflow-hidden flex flex-col justify-between ${
                        isCritique
                          ? 'border-rose-300 dark:border-rose-900/80 shadow-rose-500/5 ring-1 ring-rose-500/30'
                          : isAlerte
                          ? 'border-amber-300 dark:border-amber-800/80'
                          : 'border-slate-200/80 dark:border-slate-800'
                      }`}
                    >
                      {/* Card Header */}
                      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            {getCategoryBadge(stock.categorie)}
                            <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-2 line-clamp-1">
                              {stock.nom}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                {stock.code}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">•</span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                {stock.emplacement}
                              </span>
                            </div>
                          </div>
                          <div>{getStatusBadge(statut)}</div>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                          {stock.description}
                        </p>
                      </div>

                      {/* Stock Level & Visual Gauge */}
                      <div className="p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/50 flex-1">
                        <div className="flex items-end justify-between">
                          <div>
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                              Quantité disponible :
                            </span>
                            <div className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white mt-0.5">
                              <span
                                className={
                                  isCritique
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : isAlerte
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-emerald-700 dark:text-emerald-400'
                                }
                              >
                                {stock.quantiteActuelle}
                              </span>
                              <span className="text-sm font-bold text-slate-500 dark:text-slate-400 ml-1.5">
                                {stock.unite}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                              Mise à jour :
                            </span>
                            <span className="font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                              {stock.derniereMiseAJour.slice(5)}
                            </span>
                          </div>
                        </div>

                        {/* Thresholds comparison bar */}
                        <div>
                          <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                            <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 font-mono">
                              Critique : ≤ {stock.seuilCritique} {stock.unite}
                            </span>
                            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-mono">
                              Alerte : ≤ {stock.seuilAlerte} {stock.unite}
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="relative w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            {/* Critical threshold marker line */}
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10"
                              style={{ left: `${critiquePercent}%` }}
                              title={`Seuil critique: ${stock.seuilCritique} ${stock.unite}`}
                            />
                            {/* Alert threshold marker line */}
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10"
                              style={{ left: `${alertePercent}%` }}
                              title={`Seuil alerte: ${stock.seuilAlerte} ${stock.unite}`}
                            />
                            {/* Current quantity fill */}
                            <div
                              className={`h-full transition-all duration-300 rounded-full ${
                                isCritique
                                  ? 'bg-rose-500'
                                  : isAlerte
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${currentPercent}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                            <span>0</span>
                            <span>Jauge de sécurité relative</span>
                            <span>Capacité max</span>
                          </div>
                        </div>

                        {/* Supplier and Notification Info */}
                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                            <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1">
                              <Truck className="w-3 h-3" />
                              Fournisseur :
                            </span>
                            <span className="font-semibold truncate max-w-[170px]" title={stock.fournisseurNom}>
                              {stock.fournisseurNom}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                            <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1">
                              <PhoneCall className="w-3 h-3" />
                              Contact urgent :
                            </span>
                            <a
                              href={`tel:${stock.fournisseurContact}`}
                              className="font-mono text-cyan-600 dark:text-cyan-400 hover:underline"
                            >
                              {stock.fournisseurContact}
                            </a>
                          </div>

                          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                            <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Délai de livraison :
                            </span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                              {stock.delaiLivraisonJours} jour(s)
                            </span>
                          </div>

                          {/* SMS Notification status */}
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1">
                              <Smartphone className="w-3 h-3" />
                              Alerte SMS auto :
                            </span>
                            {stock.notificationActive ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                <Check className="w-3 h-3" />
                                {stock.destinataireAlerte.split(' ')[0]}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                                <X className="w-3 h-3" />
                                Désactivé
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        <button
                          onClick={() => openMovementModal(stock)}
                          className="flex-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <ArrowDownRight className="w-3.5 h-3.5 text-cyan-600" />
                          <span>Mouvement</span>
                        </button>

                        <button
                          onClick={() => openEditModal(stock)}
                          className="flex-1 px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Settings2 className="w-3.5 h-3.5" />
                          <span>Seuils</span>
                        </button>

                        <button
                          onClick={() => handleTestAlert(stock)}
                          title="Tester l'envoi de notification SMS"
                          className="p-1.5 rounded-xl text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredStocks.length === 0 && (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <Boxes className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Aucun article de stock ne correspond aux filtres sélectionnés.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Modifiez la catégorie ou l'état de stock pour afficher les articles.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* SUB-VIEW 2: JOURNAL DES MOUVEMENTS DE STOCK */}
          {stockSubTab === 'MOUVEMENTS' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Registre des Entrées / Sorties de Magasin
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Traçabilité complète des réapprovisionnements et des consommations pour le traitement de l'eau.
                  </p>
                </div>
                <button
                  onClick={() => openMovementModal()}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Enregistrer mouvement</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Date & Heure</th>
                      <th className="py-3 px-4">Article</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Quantité</th>
                      <th className="py-3 px-4">Nouveau Solde</th>
                      <th className="py-3 px-4">Motif Opérationnel</th>
                      <th className="py-3 px-4">N° Bon / Pièce</th>
                      <th className="py-3 px-4">Responsable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {mouvements.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                          {m.date}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                          {m.articleNom}
                        </td>
                        <td className="py-3.5 px-4">
                          {m.type === 'ENTREE' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                              <ArrowDownRight className="w-3 h-3" />
                              ENTRÉE (LIVRAISON)
                            </span>
                          ) : m.type === 'SORTIE' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                              <ArrowUpRight className="w-3 h-3" />
                              SORTIE (UTILISATION)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                              AJUSTEMENT
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold">
                          <span
                            className={
                              m.type === 'ENTREE'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }
                          >
                            {m.type === 'ENTREE' ? '+' : '-'}
                            {m.quantite}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {m.quantiteApres}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate" title={m.motif}>
                          {m.motif}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                          {m.referenceBon || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-medium">
                          {m.responsableNom}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUB-VIEW 3: HISTORIQUE DES ALERTES DÉCLENCHÉES */}
          {stockSubTab === 'ALERTES' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Registre des Alertes & Notifications SMS Envoyées
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Historique des dépassements de seuils critiques et accusés d'envoi de la passerelle SMS.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {alertesStock.length} alertes consignées
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Date Alerte</th>
                      <th className="py-3 px-4">Article</th>
                      <th className="py-3 px-4">Niveau</th>
                      <th className="py-3 px-4">Message Transmis (SMS)</th>
                      <th className="py-3 px-4">Destinataire d'Urgence</th>
                      <th className="py-3 px-4">Statut</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {alertesStock.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {a.date}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                          {a.articleNom}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {a.niveau === 'RUPTURE' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white">
                              RUPTURE
                            </span>
                          ) : a.niveau === 'CRITIQUE' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300">
                              CRITIQUE
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                              ALERTE
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-md">
                          <p className="line-clamp-2 text-[11px] font-mono bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
                            {a.message}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-cyan-700 dark:text-cyan-400 whitespace-nowrap">
                          {a.destinataireTel}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {a.statut === 'ENVOYEE' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200">
                              <Clock className="w-3 h-3" />
                              EN COURS DE TRAITEMENT
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              RÉSOLUE & TRAITÉE
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {a.statut === 'ENVOYEE' && (
                            <button
                              onClick={() => {
                                store.marquerAlerteStockTraitee(a.id);
                                triggerToast(`Alerte pour ${a.articleNom} marquée comme traitée.`);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] transition cursor-pointer border border-emerald-200 dark:border-emerald-800"
                            >
                              Marquer traitée
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PRODUCTION D'EAU & PERTES RÉSEAU (NRW)                              */}
      {/* ========================================================================= */}
      {activeTab === 'PRODUCTION' && (
        <div className="space-y-6">
          {/* Bilan & Indicateurs Clés */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Volume total pompé</div>
              <div className="text-2xl font-extrabold text-sky-800 dark:text-cyan-300 font-mono mt-1">
                {formatNumberDot(bilan.volumeProduitM3)} m³
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Compteurs en tête de forage</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Volume facturé / distribué</div>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                {formatNumberDot(bilan.volumeConsommeM3)} m³
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Compteurs abonnés & bornes</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Volume de pertes estimé</div>
              <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono mt-1">
                {formatNumberDot(bilan.perteVolumeM3)} m³
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Fuites physiques ou sous-comptage</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Taux d'eau non comptabilisée</div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`text-2xl font-black font-mono ${
                    bilan.tauxPertePourcent && bilan.tauxPertePourcent > 18
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {bilan.tauxPertePourcent !== null ? `${bilan.tauxPertePourcent}%` : 'Non calculable'}
                </span>
                {bilan.statutAlerte === 'ALERTE_PERTE' && (
                  <span
                    className="p-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400"
                    title="Seuil critique dépassé (> 18%)"
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </span>
                )}
                {bilan.statutAlerte === 'NORMAL' && (
                  <span
                    className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                    title="Rendement conforme (< 18%)"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Seuil d'alerte : 18.0%</div>
            </div>
          </div>

          {/* Alerte Explication Card */}
          {bilan.statutAlerte === 'ALERTE_PERTE' && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">
                  Alerte Pertes Réseau : Le taux d'eau non comptabilisée ({bilan.tauxPertePourcent}%) dépasse le seuil critique (18%).
                </strong>
                <p className="mt-1 text-rose-700 dark:text-rose-300">
                  Des fuites sous pression, des vannes de décharge défectueuses ou des branchements non comptabilisés sont suspectés sur le réseau de distribution. Lancez une inspection de terrain ou signalez une intervention dans le module Maintenance.
                </p>
              </div>
            </div>
          )}

          {/* Production Readings Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Historique des Relevés de Tête de Forage
              </h3>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {filteredProduction.length} enregistrements
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Date Relevé</th>
                    <th className="py-3 px-4">Forage</th>
                    <th className="py-3 px-4">Ancien Index Général</th>
                    <th className="py-3 px-4">Nouvel Index Général</th>
                    <th className="py-3 px-4">Volume Pompé (Production)</th>
                    <th className="py-3 px-4">Agent Releveur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredProduction.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">{p.dateReleve}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">{p.forageNom}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">{formatNumberDot(p.ancienIndexM3)} m³</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-sky-900 dark:text-cyan-300">{formatNumberDot(p.nouvelIndexM3)} m³</td>
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-cyan-800 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800 font-mono">
                          +{formatNumberDot(p.volumeProduitM3)} m³
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{p.agentNom}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CONFIGURATION DES SEUILS CRITIQUES & NOTIFICATIONS               */}
      {/* ========================================================================= */}
      {editingStockItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300">
                    <Settings2 className="w-5 h-5" />
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Paramétrage des Seuils Critiques
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                  {editingStockItem.nom} ({editingStockItem.code}) • Unité : {editingStockItem.unite}
                </p>
              </div>

              <button
                onClick={() => setEditingStockItem(null)}
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSeuils} className="space-y-5 mt-4 text-xs">
              {/* Threshold values */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60">
                  <label className="block text-rose-950 dark:text-rose-200 font-bold mb-1 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    Seuil Critique d'Urgence ({editingStockItem.unite}) *
                  </label>
                  <p className="text-[11px] text-rose-800/80 dark:text-rose-300/80 mb-2">
                    Niveau plancher en-deçà duquel une rupture de traitement ou d'exploitation survient.
                  </p>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={formSeuilCritique}
                    onChange={(e) => setFormSeuilCritique(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-900 text-rose-900 dark:text-rose-100 font-mono font-bold text-base focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60">
                  <label className="block text-amber-950 dark:text-amber-200 font-bold mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Seuil d'Alerte Préventive ({editingStockItem.unite}) *
                  </label>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mb-2">
                    Niveau déclenchant la préparation du bon de commande fournisseur.
                  </p>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={formSeuilAlerte}
                    onChange={(e) => setFormSeuilAlerte(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-100 font-mono font-bold text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Automatic notification settings */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BellRing className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      Notifications SMS d'Urgence Automatiques
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formNotificationActive}
                      onChange={(e) => setFormNotificationActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                  </label>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Transmet instantanément une alerte d'astreinte sur le réseau GSM / Orange SMS API dès que le stock franchit le seuil critique.
                </p>

                {formNotificationActive && (
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Destinataire de l'alerte d'astreinte (Nom & Numéro de téléphone) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formDestinataireAlerte}
                      onChange={(e) => setFormDestinataireAlerte(e.target.value)}
                      placeholder="Ex: Moussa Fall (+221 77 410 20 30)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                )}
              </div>

              {/* Supplier & Logistics Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    Fournisseur agréé
                  </label>
                  <input
                    type="text"
                    value={formFournisseurNom}
                    onChange={(e) => setFormFournisseurNom(e.target.value)}
                    placeholder="Nom entreprise / société"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    Téléphone commande directe
                  </label>
                  <input
                    type="text"
                    value={formFournisseurContact}
                    onChange={(e) => setFormFournisseurContact(e.target.value)}
                    placeholder="+221 ..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    Délai moyen d'approvisionnement (jours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formDelaiLivraison}
                    onChange={(e) => setFormDelaiLivraison(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    Emplacement de stockage
                  </label>
                  <input
                    type="text"
                    value={formEmplacement}
                    onChange={(e) => setFormEmplacement(e.target.value)}
                    placeholder="Magasin central, Bâche Forage..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* Live Preview of Threshold State */}
              <div className="p-3.5 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-cyan-950 dark:text-cyan-200">
                <span className="font-bold flex items-center gap-1.5 mb-1 text-xs">
                  <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  Aperçu du statut avec cette configuration :
                </span>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Avec un stock actuel de <strong className="font-mono text-cyan-800 dark:text-cyan-300">{editingStockItem.quantiteActuelle} {editingStockItem.unite}</strong>, le statut passera à{' '}
                  <strong className="underline">
                    {editingStockItem.quantiteActuelle <= formSeuilCritique
                      ? 'CRITIQUE (Notification SMS active)'
                      : editingStockItem.quantiteActuelle <= formSeuilAlerte
                      ? 'ALERTE BASSE'
                      : 'CONFORME'}
                  </strong>.
                </p>
              </div>

              {/* Form buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStockItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer shadow-sm transition"
                >
                  Enregistrer les seuils de stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: MOUVEMENT DE STOCK (ENTRÉE / SORTIE)                             */}
      {/* ========================================================================= */}
      {showQuickMovementModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  <ArrowDownRight className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Enregistrer un Mouvement de Stock
                </h3>
              </div>

              <button
                onClick={() => setShowQuickMovementModal(false)}
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {mvtError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{mvtError}</span>
              </div>
            )}

            <form onSubmit={handleSaveMovement} className="space-y-4 mt-4 text-xs">
              {/* Select Article */}
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  Article de stock concerné *
                </label>
                <select
                  value={mvtSelectedStockId}
                  onChange={(e) => {
                    setMvtSelectedStockId(e.target.value);
                    const found = stocks.find((s) => s.id === e.target.value);
                    if (found) setMovementStockItem(found);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {stocks.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nom} ({s.quantiteActuelle} {s.unite} restants)
                    </option>
                  ))}
                </select>
              </div>

              {/* Movement Type Toggle */}
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  Sens du mouvement *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMvtType('ENTREE')}
                    className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      mvtType === 'ENTREE'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4" />
                    <span>ENTRÉE (Réception fournisseur)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMvtType('SORTIE')}
                    className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      mvtType === 'SORTIE'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>SORTIE (Consommation / Pose)</span>
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Quantité {mvtType === 'ENTREE' ? 'réceptionnée' : 'consommée'} ({movementStockItem?.unite || 'unités'}) *
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  required
                  value={mvtQuantite}
                  onChange={(e) => setMvtQuantite(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border-2 border-cyan-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold text-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              {/* Movement Impact Projection */}
              {movementStockItem && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between font-mono text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Stock actuel</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {movementStockItem.quantiteActuelle} {movementStockItem.unite}
                    </span>
                  </div>

                  <span className="text-base font-bold text-slate-400">➔</span>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Nouveau solde prévu</span>
                    <span
                      className={`text-sm font-black ${
                        (mvtType === 'ENTREE'
                          ? movementStockItem.quantiteActuelle + mvtQuantite
                          : movementStockItem.quantiteActuelle - mvtQuantite) <= movementStockItem.seuilCritique
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {mvtType === 'ENTREE'
                        ? movementStockItem.quantiteActuelle + mvtQuantite
                        : movementStockItem.quantiteActuelle - mvtQuantite}{' '}
                      {movementStockItem.unite}
                    </span>
                  </div>
                </div>
              )}

              {/* Motif */}
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  Motif d'intervention ou d'approvisionnement *
                </label>
                <input
                  type="text"
                  required
                  value={mvtMotif}
                  onChange={(e) => setMvtMotif(e.target.value)}
                  placeholder="Ex: Désinfection bâche de reprise, remplacement compteur bloqué..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Voucher / Receipt reference */}
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  Référence bon de livraison ou bon de sortie
                </label>
                <input
                  type="text"
                  value={mvtReferenceBon}
                  onChange={(e) => setMvtReferenceBon(e.target.value)}
                  placeholder="Ex: LIV-2026-981 ou BON-SORT-042"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowQuickMovementModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer shadow-sm transition"
                >
                  Valider le mouvement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: RELEVÉ DE PRODUCTION D'EAU (TÊTE DE FORAGE)                     */}
      {/* ========================================================================= */}
      {showAddProdModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-black text-[#082F49] dark:text-cyan-300 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              Relevé de Tête de Forage (Compteur Général)
            </h3>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduction} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                  Forage hydraulique *
                </label>
                <select
                  value={formForageId}
                  onChange={(e) => setFormForageId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-semibold"
                >
                  {forages.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nom} ({f.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                    Ancien Index (m³)
                  </label>
                  <input
                    type="number"
                    value={ancienIndex}
                    onChange={(e) => setAncienIndex(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Nouvel Index lu *
                  </label>
                  <input
                    type="number"
                    required
                    min={ancienIndex}
                    value={nouvelIndex}
                    onChange={(e) => setNouvelIndex(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border-2 border-cyan-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold text-base focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
              </div>

              {/* Volume preview */}
              <div className="p-3.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-800 flex items-center justify-between">
                <span className="text-cyan-900 dark:text-cyan-200 font-medium">Volume pompé :</span>
                <span className="text-xl font-black text-cyan-800 dark:text-cyan-300 font-mono">
                  {nouvelIndex > ancienIndex ? formatNumberDot(nouvelIndex - ancienIndex) : 0} m³
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddProdModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer transition"
                >
                  Valider le relevé général
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
