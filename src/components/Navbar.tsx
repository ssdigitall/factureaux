import React, { useState, useEffect, useRef } from 'react';
import {
  Droplets,
  Shield,
  UserCheck,
  Building2,
  RefreshCw,
  LogOut,
  ChevronDown,
  Layers,
  Sparkles,
  Database,
  Lock,
  Sun,
  Moon,
  Monitor,
  Check,
  Wifi,
  WifiOff,
  HardDrive,
  MessageSquare,
  Mic,
} from 'lucide-react';
import { store } from '../services/store';
import { UserProfile, UserRole } from '../types';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import { useOffline } from '../context/OfflineContext';
import { PWAInstallButton } from './PWAInstallButton';
import { HeaderNotificationsDropdown } from './HeaderNotificationsDropdown';
import { voiceCommandService } from '../services/voiceCommandService';

interface NavbarProps {
  onNavigateLandingSection?: (sectionId: string) => void;
  isInApp: boolean;
  onToggleAppView: (inApp: boolean) => void;
  activeModule: string;
  onSelectModule: (module: string) => void;
  onOpenAuth: () => void;
  onOpenVoiceAssistant?: () => void;
}

const ROLE_LABELS: Record<UserRole, { label: string; color: string; desc: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'bg-purple-900 text-purple-200 border-purple-700', desc: 'Gestion globale SaaS FACTUREAU' },
  ADMIN_ORG: { label: 'Admin Org', color: 'bg-sky-900 text-sky-200 border-sky-700', desc: 'Accès complet ASUFOR' },
  ADMIN_FORAGE: { label: 'Admin Forage', color: 'bg-indigo-900 text-indigo-200 border-indigo-700', desc: 'Gestion technique forages' },
  TRESORIER: { label: 'Trésorier', color: 'bg-emerald-900 text-emerald-200 border-emerald-700', desc: 'Paiements, caisse & dépenses' },
  RELEVEUR: { label: 'Releveur', color: 'bg-amber-900 text-amber-200 border-amber-700', desc: 'Index compteurs & tournées' },
  FONTAINIER: { label: 'Fontainier', color: 'bg-cyan-900 text-cyan-200 border-cyan-700', desc: 'Bornes & ventes directes' },
  LECTEUR: { label: 'Lecteur', color: 'bg-slate-800 text-slate-300 border-slate-700', desc: 'Consultation & rapports' },
};

export const Navbar: React.FC<NavbarProps> = ({
  onNavigateLandingSection,
  isInApp,
  onToggleAppView,
  activeModule,
  onSelectModule,
  onOpenAuth,
  onOpenVoiceAssistant,
}) => {
  const { mode, resolvedTheme, setThemeMode } = useTheme();
  const { isOnline, isSimulatedOffline, setShowSyncModal } = useOffline();
  const [currentUser, setCurrentUser] = useState<UserProfile>(store.getCurrentUser());
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);

  const roleSwitcherRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const users = store.getUsers();

  useEffect(() => {
    return store.subscribe(() => {
      setCurrentUser(store.getCurrentUser());
    });
  }, []);

  useEffect(() => {
    return voiceCommandService.subscribe((state) => {
      setIsVoiceListening(state.isListening);
    });
  }, []);

  // Fermer les menus lors d'un clic à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleSwitcherRef.current && !roleSwitcherRef.current.contains(event.target as Node)) {
        setShowRoleSwitcher(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitchUser = (user: UserProfile) => {
    store.setCurrentUser(user);
    setShowRoleSwitcher(false);
  };

  const handleResetData = () => {
    if (window.confirm('Voulez-vous réinitialiser toutes les données aux valeurs initiales de démonstration ?')) {
      store.resetToPristine();
    }
  };

  const roleInfo = ROLE_LABELS[currentUser.role] || { label: currentUser.role, color: 'bg-slate-800 text-slate-300', desc: '' };

  return (
    <header className="sticky top-0 z-50 bg-[#082F49] text-white border-b border-sky-950/80 shadow-md">
      {/* Top Banner: Environment, Theme Switcher & Quick Role Switcher */}
      <div className="bg-[#031c2d] px-4 py-1.5 text-xs border-b border-sky-900/50 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-medium">SaaS FACTUREAU v3.0</span>
          <span className="text-slate-500">|</span>
          <span className="text-cyan-300 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5" />
            {currentUser.organisationNom || 'Plateforme FACTUREAU'}
          </span>
          {currentUser.organisationId === 'org-keur-momar-sarr' && (
            <span className="bg-amber-900/80 text-amber-200 border border-amber-700/60 text-[10px] px-1.5 py-0.5 rounded font-mono">
              TENANT B (ISOLÉ)
            </span>
          )}
          {currentUser.organisationId === 'org-touba-toul' && (
            <span className="bg-sky-900/80 text-sky-200 border border-sky-700/60 text-[10px] px-1.5 py-0.5 rounded font-mono">
              TENANT A (ASUFOR TT)
            </span>
          )}

          {/* Network & Local Cache Status Pill */}
          <button
            onClick={() => setShowSyncModal(true)}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
              isOnline
                ? 'bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-amber-950 border border-amber-500 text-amber-200 hover:bg-amber-900 shadow-sm animate-pulse'
            }`}
            title="État du réseau et du cache local. Cliquez pour configurer la synchronisation."
          >
            {isOnline ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="hidden sm:inline">En ligne (Cache actif)</span>
                <span className="sm:hidden">En ligne</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-amber-300" />
                <span>Hors-Ligne {isSimulatedOffline ? '(Simulé)' : '(Local)'}</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Role Simulator dropdown */}
          <div className="relative" ref={roleSwitcherRef}>
            <button
              onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
              className="flex items-center gap-1.5 bg-sky-950/90 hover:bg-sky-900 text-slate-200 px-2.5 py-1 rounded border border-sky-800 text-xs transition cursor-pointer"
              title="Tester les permissions avec un autre profil"
            >
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">Simuler un utilisateur :</span>
              <strong className="text-white font-semibold">{currentUser.prenom} {currentUser.nom}</strong>
              <span className={`text-[10px] px-1.5 py-0.2 rounded border ${roleInfo.color}`}>
                {roleInfo.label}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showRoleSwitcher && (
              <div className="absolute right-0 mt-1 w-80 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-2 z-50 text-slate-200">
                <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider border-b border-slate-800 mb-1">
                  Changer d'utilisateur (RBAC & Isolation Tenant)
                </div>
                <div className="space-y-1 max-h-72 overflow-y-auto">
                  {users.map((u) => {
                    const r = ROLE_LABELS[u.role];
                    const isSelected = u.id === currentUser.id;
                    return (
                      <button
                        key={u.id}
                        onClick={() => handleSwitchUser(u)}
                        className={`w-full text-left p-2 rounded text-xs flex flex-col gap-0.5 transition cursor-pointer ${
                          isSelected ? 'bg-sky-800/80 text-white' : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">
                            {u.prenom} {u.nom}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border ${r?.color}`}>
                            {r?.label}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {u.organisationNom}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Segmented Theme Controls (Clair / Sombre / Système) in top bar */}
          <div
            className="hidden sm:inline-flex items-center bg-sky-950/90 rounded-lg p-0.5 border border-sky-800/80 text-[11px]"
            role="group"
            aria-label="Sélecteur rapide de thème"
          >
            <button
              onClick={() => setThemeMode('light')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition cursor-pointer ${
                mode === 'light'
                  ? 'bg-amber-500/25 text-amber-300 font-bold border border-amber-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-sky-900/40'
              }`}
              title="Thème Clair"
            >
              <Sun className="w-3 h-3 text-amber-400" />
              <span>Clair</span>
            </button>
            <button
              onClick={() => setThemeMode('dark')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition cursor-pointer ${
                mode === 'dark'
                  ? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-sky-900/40'
              }`}
              title="Thème Sombre (anti-fatigue oculaire)"
            >
              <Moon className="w-3 h-3 text-cyan-300" />
              <span>Sombre</span>
            </button>
            <button
              onClick={() => setThemeMode('system')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition cursor-pointer ${
                mode === 'system'
                  ? 'bg-sky-500/30 text-white font-bold border border-sky-400/50 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-sky-900/40'
              }`}
              title={`Mode Système (${resolvedTheme === 'dark' ? 'Sombre' : 'Clair'})`}
            >
              <Monitor className="w-3 h-3 text-sky-400" />
              <span>Système</span>
            </button>
          </div>

          <button
            onClick={handleResetData}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition text-xs cursor-pointer ml-1"
            title="Remettre les données d'origine"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="hidden lg:inline">Réinitialiser</span>
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggleAppView(false)}
            className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-[#0369A1] p-0.5 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
              <div className="w-full h-full bg-[#082F49] rounded-[10px] flex items-center justify-center">
                <Droplets className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent">
                FACTUREAU
              </div>
              <div className="text-[10px] text-cyan-300 tracking-wide font-medium -mt-1 hidden sm:block">
                L'eau bien gérée, l'avenir assuré
              </div>
            </div>
          </button>
        </div>

        {/* Navigation Tabs */}
        {!isInApp ? (
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <button
              onClick={() => onNavigateLandingSection?.('hero')}
              className="hover:text-cyan-400 transition cursor-pointer"
            >
              Accueil
            </button>
            <button
              onClick={() => onNavigateLandingSection?.('features')}
              className="hover:text-cyan-400 transition cursor-pointer"
            >
              Fonctionnalités
            </button>
            <button
              onClick={() => onNavigateLandingSection?.('how-it-works')}
              className="hover:text-cyan-400 transition cursor-pointer"
            >
              Comment ça marche
            </button>
            <button
              onClick={() => onNavigateLandingSection?.('pricing')}
              className="hover:text-cyan-400 transition cursor-pointer"
            >
              Tarifs
            </button>
            <button
              onClick={() => onNavigateLandingSection?.('faq')}
              className="hover:text-cyan-400 transition cursor-pointer"
            >
              FAQ
            </button>
            <button
              onClick={() => onNavigateLandingSection?.('contact')}
              className="hover:text-cyan-400 transition cursor-pointer"
            >
              Contact
            </button>
          </nav>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectModule('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeModule === 'dashboard'
                  ? 'bg-sky-700 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-sky-900/60'
              }`}
            >
              Tableau de bord
            </button>
            <button
              onClick={() => onSelectModule('factures')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeModule === 'factures'
                  ? 'bg-sky-700 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-sky-900/60'
              }`}
            >
              Factures
            </button>
            <button
              onClick={() => onSelectModule('paiements')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeModule === 'paiements'
                  ? 'bg-sky-700 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-sky-900/60'
              }`}
            >
              Paiements & Wave
            </button>
            <button
              onClick={() => onSelectModule('caisse')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeModule === 'caisse'
                  ? 'bg-sky-700 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-sky-900/60'
              }`}
            >
              Caisse & Dépenses
            </button>
            <button
              onClick={() => onSelectModule('security')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition cursor-pointer ${
                activeModule === 'security'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/80 border border-emerald-800/60'
              }`}
              title="Audit & Tests de Sécurité Automatisés"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Tests Sécurité</span>
            </button>

            <button
              onClick={() => onSelectModule('sms-alerts')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition cursor-pointer ${
                activeModule === 'sms-alerts'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-cyan-950/60 text-cyan-300 hover:bg-cyan-900/80 border border-cyan-800/60'
              }`}
              title="Configuration des Alertes SMS automatiques (Factures & Coupures)"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Alertes SMS</span>
            </button>
          </div>
        )}

        {/* Right Action Buttons with Notifications, Voice, PWA Install & Theme Selector */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Real-time Notifications & Push Alerts Center */}
          <HeaderNotificationsDropdown
            onSelectModule={(mod) => {
              onToggleAppView(true);
              onSelectModule(mod);
            }}
          />

          {/* Voice Assistant Web Speech API Button */}
          <button
            onClick={onOpenVoiceAssistant}
            className={`p-2 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer relative ${
              isVoiceListening
                ? 'bg-gradient-to-r from-rose-600 to-cyan-600 text-white shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-400'
                : 'bg-sky-950/80 hover:bg-sky-900 text-cyan-300 hover:text-white border border-sky-800/80'
            }`}
            title="Commande Vocale Web Speech : Navigation & Saisie de Relevé de Compteur"
            aria-label="Assistant vocal"
          >
            <Mic className={`w-4 h-4 ${isVoiceListening ? 'animate-pulse text-white' : 'text-cyan-400'}`} />
            <span className="hidden xl:inline">Commande Vocale</span>
            {isVoiceListening && (
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping absolute -top-0.5 -right-0.5" />
            )}
          </button>

          {/* In-App PWA Install Button */}
          <PWAInstallButton />

          {/* Main Theme Selector Menu */}
          <div className="relative" ref={themeMenuRef}>
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-slate-200 hover:text-white bg-sky-950/80 hover:bg-sky-900 border border-sky-800/80 transition flex items-center gap-1.5 text-xs cursor-pointer shadow-sm focus:outline-none"
              title="Personnaliser l'affichage : Clair, Sombre ou Système"
              aria-label="Sélecteur de thème"
              aria-expanded={showThemeMenu}
            >
              {mode === 'light' && <Sun className="w-4 h-4 text-amber-400" />}
              {mode === 'dark' && <Moon className="w-4 h-4 text-cyan-300" />}
              {mode === 'system' && <Monitor className="w-4 h-4 text-sky-400" />}
              <span className="hidden sm:inline font-semibold">
                {mode === 'light' ? 'Clair' : mode === 'dark' ? 'Sombre' : 'Système'}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showThemeMenu ? 'rotate-180' : ''}`}
              />
            </button>

            {showThemeMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 text-slate-200">
                <div className="text-[10px] font-semibold text-slate-400 px-2.5 py-1 uppercase tracking-wider border-b border-slate-800 mb-1 flex items-center justify-between">
                  <span>Thème d'affichage</span>
                  <span className="text-[9px] font-mono text-cyan-400">
                    Rendu : {resolvedTheme === 'dark' ? 'Sombre' : 'Clair'}
                  </span>
                </div>

                <div className="space-y-1">
                  {/* Option Clair */}
                  <button
                    onClick={() => {
                      setThemeMode('light');
                      setShowThemeMenu(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition cursor-pointer ${
                      mode === 'light'
                        ? 'bg-amber-500/15 text-white border border-amber-500/40 font-bold'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                        <Sun className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-white">Clair</div>
                        <div className="text-[10px] text-slate-400">Affichage lumineux standard</div>
                      </div>
                    </div>
                    {mode === 'light' && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                  </button>

                  {/* Option Sombre */}
                  <button
                    onClick={() => {
                      setThemeMode('dark');
                      setShowThemeMenu(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition cursor-pointer ${
                      mode === 'dark'
                        ? 'bg-cyan-500/15 text-white border border-cyan-500/40 font-bold'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                        <Moon className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-white">Sombre</div>
                        <div className="text-[10px] text-slate-400">Réduit la fatigue oculaire</div>
                      </div>
                    </div>
                    {mode === 'dark' && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                  </button>

                  {/* Option Système */}
                  <button
                    onClick={() => {
                      setThemeMode('system');
                      setShowThemeMenu(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition cursor-pointer ${
                      mode === 'system'
                        ? 'bg-sky-500/20 text-white border border-sky-400/50 font-bold'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400">
                        <Monitor className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-white">Système</div>
                        <div className="text-[10px] text-slate-400">
                          Automatique ({resolvedTheme === 'dark' ? 'Sombre' : 'Clair'})
                        </div>
                      </div>
                    </div>
                    {mode === 'system' && <Check className="w-4 h-4 text-sky-400 shrink-0" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {!isInApp ? (
            <>
              <button
                onClick={onOpenAuth}
                className="text-sm font-medium text-slate-200 hover:text-cyan-400 transition px-3 py-2 cursor-pointer"
              >
                Se connecter
              </button>
              <button
                onClick={() => onToggleAppView(true)}
                className="bg-gradient-to-r from-cyan-500 to-[#0369A1] hover:from-cyan-400 hover:to-sky-700 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span>Accéder à l'application</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => onSelectModule('schema')}
                className="hidden lg:flex items-center gap-1.5 text-xs text-slate-300 hover:text-cyan-300 bg-sky-950/80 px-2.5 py-1.5 rounded-lg border border-sky-800 transition cursor-pointer"
                title="Consulter le schéma PostgreSQL & RLS"
              >
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>Schéma SQL</span>
              </button>
              <button
                onClick={() => onToggleAppView(false)}
                className="text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-600 transition cursor-pointer"
              >
                Landing page
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
