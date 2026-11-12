import React, { useState, useEffect } from 'react';
import {
  Droplets,
  LayoutDashboard,
  Users,
  Gauge,
  Receipt,
  CreditCard,
  Wallet,
  Building2,
  Wrench,
  AlertTriangle,
  BarChart3,
  ShieldCheck,
  Database,
  Shield,
  Menu,
  X,
  Sparkles,
  RefreshCw,
  LogOut,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  HardDrive,
  Wifi,
  WifiOff,
  ShieldAlert,
} from 'lucide-react';
import { useTheme } from './context/ThemeContext';
import { useOffline } from './context/OfflineContext';
import { Navbar } from './components/Navbar';
import { OfflineIndicator } from './components/OfflineIndicator';
import { OfflineSyncModal } from './components/OfflineSyncModal';
import { LandingPage } from './components/LandingPage';
import { DashboardView } from './components/DashboardView';
import { ForagesView } from './components/ForagesView';
import { AbonnesView } from './components/AbonnesView';
import { CompteursReleveView } from './components/CompteursReleveView';
import { FacturesView } from './components/FacturesView';
import { PaiementsView } from './components/PaiementsView';
import { DepensesCaisseView } from './components/DepensesCaisseView';
import { BornesFontainesView } from './components/BornesFontainesView';
import { ProductionView } from './components/ProductionView';
import { PannesMaintenanceView } from './components/PannesMaintenanceView';
import { ImpayesCoupuresView } from './components/ImpayesCoupuresView';
import { SmsAlertsConfigView } from './components/SmsAlertsConfigView';
import { RapportsView } from './components/RapportsView';
import { AuditLogsView } from './components/AuditLogsView';
import { SecurityMatrixView } from './components/SecurityMatrixView';
import { SqlSchemaView } from './components/SqlSchemaView';
import { SuperAdminView } from './components/SuperAdminView';
import { AuthModal } from './components/AuthModal';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { ToastContainer } from './components/ToastContainer';
import { MessageSquare } from 'lucide-react';
import { store } from './services/store';
import { UserProfile } from './types';
import { voiceCommandService } from './services/voiceCommandService';

export default function App() {
  const { mode, resolvedTheme, setThemeMode } = useTheme();
  const { isOnline, setShowSyncModal, cacheStats } = useOffline();
  const [isInApp, setIsInApp] = useState(false);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<UserProfile>(store.getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [prefilledFactureId, setPrefilledFactureId] = useState<string | undefined>(undefined);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [voiceReleveState, setVoiceReleveState] = useState<{
    abonneId?: string;
    nouvelIndex?: number;
    openModal: boolean;
    version: number;
  }>({ openModal: false, version: 0 });

  useEffect(() => {
    return store.subscribe(() => {
      setCurrentUser(store.getCurrentUser());
    });
  }, []);

  useEffect(() => {
    voiceCommandService.registerActionHandlers({
      onNavigate: (moduleId: string) => {
        setIsInApp(true);
        setActiveModule(moduleId);
      },
      onReleveDictated: (data) => {
        setIsInApp(true);
        setActiveModule('compteurs');
        setVoiceReleveState((prev) => ({
          abonneId: data.abonne?.id,
          nouvelIndex: data.nouvelIndex,
          openModal: true,
          version: prev.version + 1,
        }));
      },
    });
  }, []);

  const handleNavigateLandingSection = (sectionId: string) => {
    setIsInApp(false);
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleEncaisserFactureDirect = (factureId: string) => {
    setPrefilledFactureId(factureId);
    setActiveModule('paiements');
  };

  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, perm: 'dashboard' },
    { id: 'forages', label: 'Forages', icon: Droplets, perm: 'forages' },
    { id: 'abonnes', label: 'Abonnés', icon: Users, perm: 'abonnes' },
    { id: 'compteurs', label: 'Compteurs & Relevés', icon: Gauge, perm: 'releves' },
    { id: 'factures', label: 'Factures d\'eau', icon: Receipt, perm: 'factures' },
    { id: 'paiements', label: 'Paiements & Wave', icon: CreditCard, perm: 'paiements' },
    { id: 'caisse', label: 'Caisse & Dépenses', icon: Wallet, perm: 'caisse' },
    { id: 'bornes', label: 'Bornes-Fontaines', icon: Building2, perm: 'bornes' },
    { id: 'production', label: 'Production & Pertes', icon: BarChart3, perm: 'production' },
    { id: 'pannes', label: 'Pannes & Entretien', icon: Wrench, perm: 'pannes' },
    { id: 'coupures', label: 'Impayés & Coupures', icon: AlertTriangle, perm: 'coupures' },
    { id: 'sms-alerts', label: 'Alertes SMS & Passerelle', icon: MessageSquare, perm: 'sms-alerts' },
    { id: 'rapports', label: 'Rapports & États', icon: BarChart3, perm: 'rapports' },
    { id: 'audit', label: 'Logs d\'Audit & Actions', icon: ShieldAlert, perm: 'audit' },
    { id: 'security', label: 'Tests de Sécurité RBAC', icon: ShieldCheck, perm: 'dashboard' },
    { id: 'schema', label: 'Schéma PostgreSQL', icon: Database, perm: 'dashboard' },
  ];

  if (currentUser.role === 'SUPER_ADMIN') {
    navItems.unshift({ id: 'superadmin', label: 'Admin SaaS FACTUREAU', icon: Shield, perm: 'superadmin' });
  }

  const allowedNavItems = navItems.filter((item) => store.canAccessModule(item.perm));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        onNavigateLandingSection={handleNavigateLandingSection}
        isInApp={isInApp}
        onToggleAppView={(val) => setIsInApp(val)}
        activeModule={activeModule}
        onSelectModule={(mod) => {
          setActiveModule(mod);
          setIsInApp(true);
        }}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenVoiceAssistant={() => setIsVoiceModalOpen(true)}
      />

      {/* Main Content Area */}
      {!isInApp ? (
        <LandingPage
          onStartFree={() => setIsAuthModalOpen(true)}
          onExploreDemo={() => {
            setIsInApp(true);
            setActiveModule('dashboard');
          }}
        />
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
          {/* Mobile Sidebar Toggle Button */}
          <div className="lg:hidden flex items-center justify-between bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Module actif :</span>
              <span className="text-xs font-extrabold text-[#082F49] dark:text-cyan-400 uppercase">
                {allowedNavItems.find((n) => n.id === activeModule)?.label || activeModule}
              </span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Sidebar Navigation */}
          <aside
            className={`${
              mobileMenuOpen ? 'block' : 'hidden'
            } lg:block w-full lg:w-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm shrink-0 self-start transition-colors duration-200`}
          >
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
              Modules Métiers & Gestion
            </div>

            <nav className="space-y-1">
              {allowedNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveModule(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                      isActive
                        ? 'bg-[#082F49] dark:bg-sky-800 text-white shadow-sm font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400 dark:text-slate-500'}`} />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                );
              })}
            </nav>

            {/* Quick Context Summary in Sidebar */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5">
              <div className="flex items-center justify-between">
                <span>Tenant :</span>
                <strong className="text-slate-800 dark:text-slate-200 font-mono text-[10px]">
                  {currentUser.organisationNom?.substring(0, 16)}...
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Rôle :</span>
                <span className="font-bold text-cyan-800 dark:text-cyan-400">{currentUser.role}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Devise :</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">FCFA (XOF)</span>
              </div>
            </div>

            {/* Theme Selector in Sidebar */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                <span>Thème d'affichage</span>
                <span className="font-mono text-[9px] text-cyan-600 dark:text-cyan-400">
                  {mode === 'system' ? `Auto (${resolvedTheme === 'dark' ? 'Sombre' : 'Clair'})` : mode === 'dark' ? 'Sombre' : 'Clair'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setThemeMode('light')}
                  className={`py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
                    mode === 'light'
                      ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-300 shadow-xs font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  title="Thème Clair"
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Clair</span>
                </button>
                <button
                  onClick={() => setThemeMode('dark')}
                  className={`py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
                    mode === 'dark'
                      ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-300 shadow-xs font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  title="Thème Sombre"
                >
                  <Moon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Sombre</span>
                </button>
                <button
                  onClick={() => setThemeMode('system')}
                  className={`py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
                    mode === 'system'
                      ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  title="Mode Système (auto)"
                >
                  <Monitor className="w-3.5 h-3.5 text-sky-400" />
                  <span>Auto</span>
                </button>
              </div>
            </div>

            {/* Offline Cache Status in Sidebar */}
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowSyncModal(true)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 transition flex items-center justify-between text-left cursor-pointer group"
                title="Gérer le cache local et tester le mode hors-ligne"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                  <div>
                    <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <span>Cache Hors-Ligne</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {cacheStats.abonnesCount} abonnés prêts
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400 group-hover:underline">
                  Gérer
                </span>
              </button>
            </div>
          </aside>

          {/* Module Content View */}
          <main className="flex-1 min-w-0">
            {activeModule === 'dashboard' && (
              <DashboardView
                onNavigate={(mod) => setActiveModule(mod)}
                onOpenQuickReading={() => setActiveModule('compteurs')}
                onOpenQuickPayment={() => setActiveModule('paiements')}
                onOpenQuickExpense={() => setActiveModule('caisse')}
              />
            )}

            {activeModule === 'forages' && <ForagesView />}
            {activeModule === 'abonnes' && <AbonnesView />}
            {activeModule === 'compteurs' && (
              <CompteursReleveView
                key={`compteurs-${voiceReleveState.version}`}
                initialAbonneId={voiceReleveState.abonneId}
                initialNouvelIndex={voiceReleveState.nouvelIndex}
                initialOpenAddReleve={voiceReleveState.openModal}
              />
            )}
            {activeModule === 'factures' && (
              <FacturesView onEncaisserPaiement={handleEncaisserFactureDirect} />
            )}
            {activeModule === 'paiements' && (
              <PaiementsView initialFactureId={prefilledFactureId} />
            )}
            {activeModule === 'caisse' && <DepensesCaisseView />}
            {activeModule === 'bornes' && <BornesFontainesView />}
            {activeModule === 'production' && <ProductionView />}
            {activeModule === 'pannes' && <PannesMaintenanceView />}
            {activeModule === 'coupures' && <ImpayesCoupuresView />}
            {activeModule === 'sms-alerts' && (
              <SmsAlertsConfigView onNavigate={(mod) => setActiveModule(mod)} />
            )}
            {activeModule === 'rapports' && <RapportsView />}
            {activeModule === 'audit' && <AuditLogsView />}
            {activeModule === 'security' && <SecurityMatrixView />}
            {activeModule === 'schema' && <SqlSchemaView />}
            {activeModule === 'superadmin' && <SuperAdminView />}
          </main>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setIsInApp(true);
          setActiveModule('dashboard');
        }}
      />

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onNavigate={(mod) => {
          setIsInApp(true);
          setActiveModule(mod);
          setIsVoiceModalOpen(false);
        }}
      />

      {/* Offline Connectivity Indicator & Sync Modal */}
      <OfflineIndicator />
      <OfflineSyncModal />

      {/* Global Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
