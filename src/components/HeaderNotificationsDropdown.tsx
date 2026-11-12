import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  CreditCard,
  Wrench,
  Boxes,
  Droplets,
  ExternalLink,
  Volume2,
  VolumeX,
  Smartphone,
  Sparkles,
  Trash2,
  Check,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import {
  notificationService,
  RealtimeNotification,
  NotificationCategory,
} from '../services/notificationService';

interface HeaderNotificationsDropdownProps {
  onSelectModule: (module: string) => void;
}

export const HeaderNotificationsDropdown: React.FC<HeaderNotificationsDropdownProps> = ({
  onSelectModule,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<RealtimeNotification[]>(
    notificationService.getNotifications()
  );
  const [unreadCount, setUnreadCount] = useState<number>(notificationService.getUnreadCount());
  const [criticalCount, setCriticalCount] = useState<number>(notificationService.getCriticalCount());
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | NotificationCategory>('ALL');
  const [settings, setSettings] = useState(notificationService.getSettings());
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return notificationService.subscribe(() => {
      setNotifications(notificationService.getNotifications());
      setUnreadCount(notificationService.getUnreadCount());
      setCriticalCount(notificationService.getCriticalCount());
      setSettings(notificationService.getSettings());
      if (typeof Notification !== 'undefined') {
        setBrowserPermission(Notification.permission);
      }
    });
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggleSound = () => {
    notificationService.updateSettings({ soundEnabled: !settings.soundEnabled });
  };

  const handleRequestPush = async () => {
    const res = await notificationService.requestBrowserNotificationPermission();
    setBrowserPermission(res as NotificationPermission);
  };

  const handleNotificationClick = (notif: RealtimeNotification) => {
    notificationService.markAsRead(notif.id);
    onSelectModule(notif.moduleTarget);
    setIsOpen(false);
  };

  const filteredNotifs = notifications.filter((n) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'MAINTENANCE') return n.category === 'MAINTENANCE';
    if (selectedFilter === 'PAIEMENT') return n.category === 'PAIEMENT';
    if (selectedFilter === 'STOCK') return n.category === 'STOCK' || n.category === 'HYDRAULIQUE';
    return n.category === selectedFilter;
  });

  const formatRelativeTime = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return "À l'instant";
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
    return new Date(timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const getCategoryIcon = (category: NotificationCategory, priority: string) => {
    switch (category) {
      case 'PAIEMENT':
        return <CreditCard className="w-4 h-4 text-emerald-400" />;
      case 'MAINTENANCE':
        return priority === 'CRITIQUE' ? (
          <AlertOctagon className="w-4 h-4 text-rose-400 animate-pulse" />
        ) : (
          <Wrench className="w-4 h-4 text-amber-400" />
        );
      case 'STOCK':
        return <Boxes className="w-4 h-4 text-amber-400" />;
      case 'HYDRAULIQUE':
        return <Droplets className="w-4 h-4 text-cyan-400" />;
      default:
        return <Bell className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition flex items-center justify-center cursor-pointer ${
          isOpen
            ? 'bg-sky-800 text-white shadow-inner'
            : 'bg-sky-950/80 hover:bg-sky-900 text-slate-200 border border-sky-800/80 hover:text-white'
        }`}
        title="Centre d'alertes & notifications en direct (Paiements, Maintenance, Réseau)"
        aria-label="Centre de notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4" />

        {/* Unread Badge Counter */}
        {unreadCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[10px] font-black rounded-full flex items-center justify-center text-white shadow-md ${
              criticalCount > 0 ? 'bg-rose-600 animate-pulse' : 'bg-emerald-500'
            }`}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 sm:w-[420px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-0 z-50 text-slate-200 overflow-hidden backdrop-blur-md">
          {/* Header */}
          <div className="p-3.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-900/60 border border-sky-700/60 flex items-center justify-center text-cyan-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Centre de Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                      {unreadCount} non lues
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400">
                  Alertes paiements & maintenance en temps réel
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleToggleSound}
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                  settings.soundEnabled
                    ? 'text-cyan-400 hover:bg-slate-800'
                    : 'text-slate-500 hover:bg-slate-800'
                }`}
                title={settings.soundEnabled ? 'Son activé (cliquez pour couper)' : 'Son coupé'}
              >
                {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {unreadCount > 0 && (
                <button
                  onClick={() => notificationService.markAllAsRead()}
                  className="text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 hover:underline px-2 py-1 rounded cursor-pointer"
                  title="Marquer toutes les alertes comme lues"
                >
                  Tout marquer lu
                </button>
              )}
            </div>
          </div>

          {/* Browser Push Permission Strip */}
          <div className="px-3.5 py-2 bg-slate-800/40 border-b border-slate-800 text-[11px] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Smartphone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Notifications Push Navigateur :</span>
            </div>
            {browserPermission === 'granted' ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                <Check className="w-3 h-3" /> Activées
              </span>
            ) : browserPermission === 'denied' ? (
              <span className="text-[10px] text-rose-400 font-mono">Bloquées navigateur</span>
            ) : (
              <button
                onClick={handleRequestPush}
                className="text-[10px] font-bold text-cyan-300 hover:text-white bg-sky-900/80 hover:bg-sky-800 px-2.5 py-1 rounded transition border border-sky-700 cursor-pointer shadow-xs"
              >
                Activer le Push
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="px-3 pt-2.5 pb-2 bg-slate-900/90 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <button
              onClick={() => setSelectedFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition shrink-0 cursor-pointer ${
                selectedFilter === 'ALL'
                  ? 'bg-sky-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Tous ({notifications.length})
            </button>
            <button
              onClick={() => setSelectedFilter('PAIEMENT')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition shrink-0 cursor-pointer ${
                selectedFilter === 'PAIEMENT'
                  ? 'bg-emerald-800 text-emerald-100 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Paiements
            </button>
            <button
              onClick={() => setSelectedFilter('MAINTENANCE')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition shrink-0 cursor-pointer ${
                selectedFilter === 'MAINTENANCE'
                  ? 'bg-rose-900 text-rose-100 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Maintenance
              {criticalCount > 0 && (
                <span className="ml-1 w-2 h-2 rounded-full bg-rose-500 inline-block animate-ping" />
              )}
            </button>
            <button
              onClick={() => setSelectedFilter('STOCK')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition shrink-0 cursor-pointer ${
                selectedFilter === 'STOCK'
                  ? 'bg-amber-800 text-amber-100 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Stocks & Pertes
            </button>
          </div>

          {/* Notifications Scrollable List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {filteredNotifs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs">Aucune alerte dans cette catégorie.</p>
              </div>
            ) : (
              filteredNotifs.map((notif) => {
                const isCrit = notif.priority === 'CRITIQUE';
                const isUnread = !notif.read;

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3 transition flex items-start gap-3 cursor-pointer group ${
                      isUnread
                        ? isCrit
                          ? 'bg-rose-950/25 hover:bg-rose-950/40 border-l-2 border-rose-500'
                          : 'bg-sky-950/30 hover:bg-sky-900/40 border-l-2 border-cyan-400'
                        : 'hover:bg-slate-800/60 opacity-85'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${
                        isCrit
                          ? 'bg-rose-900/60 border border-rose-700/60'
                          : notif.category === 'PAIEMENT'
                          ? 'bg-emerald-950 border border-emerald-700/60'
                          : 'bg-sky-950 border border-sky-800/60'
                      }`}
                    >
                      {getCategoryIcon(notif.category, notif.priority)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                            {notif.title}
                          </span>
                          {isCrit && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white animate-pulse">
                              CRITIQUE
                            </span>
                          )}
                          {isUnread && !isCrit && (
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                          {formatRelativeTime(notif.timestamp)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>

                      <div className="mt-2 flex items-center justify-between text-[10px]">
                        <span className="text-cyan-400 font-semibold flex items-center gap-1 group-hover:underline">
                          <span>{notif.actionLabel || 'Ouvrir le module'}</span>
                          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            notificationService.deleteNotification(notif.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 transition"
                          title="Supprimer cette alerte"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with Demo Interactive Simulators */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-[10px] text-slate-400 font-mono">
              Simulations de tests temps réel :
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => notificationService.simulateNewPayment('WAVE')}
                className="px-2 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 font-bold transition text-[10px] cursor-pointer"
                title="Simuler la réception d'un paiement Wave en temps réel"
              >
                + Paiement Wave
              </button>
              <button
                onClick={() => notificationService.simulateCriticalMaintenanceAlert()}
                className="px-2 py-1 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-300 font-bold transition text-[10px] cursor-pointer"
                title="Simuler une alerte de panne critique sur un forage"
              >
                + Panne Critique
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
