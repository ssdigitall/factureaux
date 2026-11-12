import React, { useState } from 'react';
import {
  Building2,
  Users,
  Shield,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Activity,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { store } from '../services/store';
import { Organisation, SaaSPlan } from '../types';

export const SuperAdminView: React.FC = () => {
  const [organisations, setOrganisations] = useState<Organisation[]>(store.getOrganisations());
  const auditLogs = store.getAuditLogs();

  React.useEffect(() => {
    return store.subscribe(() => {
      setOrganisations(store.getOrganisations());
    });
  }, []);

  const totalMRR = organisations.reduce((sum, org) => {
    return sum + (org.plan === 'PROFESSIONNEL' ? 19900 : org.plan === 'ENTREPRISE' ? 29900 : 9900);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#082F49] dark:text-sky-300 flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            Administration SaaS FACTUREAU Platform
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Supervision multi-organisations, abonnements, quotas d'utilisation et santé du système.
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-3 py-1.5 rounded-xl text-xs font-bold font-mono">
          MRR SaaS Plateforme : {totalMRR.toLocaleString('fr-FR')} FCFA/mois
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Organisations clientes</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{organisations.length}</div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100% à jour de cotisation
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Forages sous contrat</div>
          <div className="text-2xl font-extrabold text-sky-800 dark:text-sky-400 mt-1">3 Forages</div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">Régions Thiès & Louga</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Santé passerelle PayDunya</div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">99.98%</div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">Webhooks opérationnels</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Événements d'audit tracés</div>
          <div className="text-2xl font-extrabold text-purple-700 dark:text-purple-400 mt-1">{auditLogs.length}</div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">Infalsifiables</div>
        </div>
      </div>

      {/* Organisations Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Organisations & Associations Enregistrées</h3>
          <span className="text-xs text-slate-400 dark:text-slate-500">Multi-tenant PostgreSQL RLS</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Nom de l'Organisation</th>
                <th className="py-3 px-4">Localisation</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Forfait SaaS</th>
                <th className="py-3 px-4">Quotas Forages / Abonnés</th>
                <th className="py-3 px-4">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {organisations.map((org) => {
                return (
                  <tr key={org.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-800 dark:text-sky-400">{org.code}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">{org.nom}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      {org.commune}, {org.region} ({org.pays})
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                      {org.contactTel}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        {org.plan}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono">
                      {org.quotas.maxForages} forages • {org.quotas.maxAbonnes} abonnés max
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {org.statut}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
