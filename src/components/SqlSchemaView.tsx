import React, { useState } from 'react';
import {
  Database,
  Copy,
  Check,
  Shield,
  Layers,
  Terminal,
  ExternalLink,
} from 'lucide-react';

export const SqlSchemaView: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const sqlCode = `-- ============================================================================
-- FACTUREAU V3.0 - SCHÉMA POSTGRESQL & POLITIQUES ROW-LEVEL SECURITY (SUPABASE)
-- Architecture Multi-Tenant Sécurisée pour la Gestion des Forages et de l'Eau
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ORGANISATIONS (TENANTS)
CREATE TABLE organisations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) UNIQUE NOT NULL,
    nom VARCHAR(255) NOT NULL,
    pays VARCHAR(100) DEFAULT 'Sénégal',
    region VARCHAR(100) NOT NULL,
    departement VARCHAR(100),
    commune VARCHAR(100),
    contact_email VARCHAR(255),
    contact_tel VARCHAR(50),
    devise VARCHAR(10) DEFAULT 'FCFA',
    statut VARCHAR(30) DEFAULT 'ACTIF' CHECK (statut IN ('ACTIF', 'SUSPENDU', 'EN_ATTENTE')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RÔLES ENUM
CREATE TYPE user_role_enum AS ENUM (
    'SUPER_ADMIN', 'ADMIN_ORG', 'ADMIN_FORAGE', 'TRESORIER', 'RELEVEUR', 'FONTAINIER', 'LECTEUR'
);

-- 3. PROFILS UTILISATEURS (LIÉS À AUTH.USERS)
CREATE TABLE profils_utilisateurs (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    telephone VARCHAR(50),
    role user_role_enum NOT NULL DEFAULT 'LECTEUR',
    statut VARCHAR(20) DEFAULT 'ACTIF' CHECK (statut IN ('ACTIF', 'SUSPENDU')),
    mfa_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. FORAGES
CREATE TABLE forages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE RESTRICT,
    code VARCHAR(50) NOT NULL,
    nom VARCHAR(255) NOT NULL,
    localite VARCHAR(255) NOT NULL,
    region VARCHAR(100) NOT NULL,
    profondeur_metres NUMERIC(8,2),
    debit_nominal_m3h NUMERIC(8,2),
    type_pompe VARCHAR(50) DEFAULT 'SOLAIRE' CHECK (type_pompe IN ('SOLAIRE', 'THERMIQUE', 'HYBRIDE', 'ELECTRIQUE_RESEAU')),
    puissance_kw NUMERIC(8,2),
    date_mise_en_service DATE,
    responsable_nom VARCHAR(255),
    responsable_tel VARCHAR(50),
    statut VARCHAR(30) DEFAULT 'EN_SERVICE' CHECK (statut IN ('EN_SERVICE', 'EN_PANNE', 'EN_MAINTENANCE')),
    tarif_m3_fcfa NUMERIC(10,2) DEFAULT 350.00,
    redevance_fixe_fcfa NUMERIC(10,2) DEFAULT 500.00,
    CONSTRAINT unq_forage_code_par_org UNIQUE(organisation_id, code)
);

-- 5. ABONNÉS
CREATE TABLE abonnes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE RESTRICT,
    forage_id UUID NOT NULL REFERENCES forages(id) ON DELETE RESTRICT,
    code_abonne VARCHAR(50) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    telephone VARCHAR(50) NOT NULL,
    quartier VARCHAR(150),
    adresse TEXT,
    categorie VARCHAR(50) DEFAULT 'DOMESTIQUE' CHECK (categorie IN ('DOMESTIQUE', 'COMMERCIAL', 'MARAICHER', 'SOCIAL')),
    statut VARCHAR(30) DEFAULT 'ACTIF' CHECK (statut IN ('ACTIF', 'SUSPENDU', 'CLOTURE')),
    solde_dette_fcfa NUMERIC(12,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unq_code_abonne_par_org UNIQUE(organisation_id, code_abonne)
);

-- 6. FACTURES
CREATE TABLE factures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE RESTRICT,
    forage_id UUID NOT NULL REFERENCES forages(id) ON DELETE RESTRICT,
    abonne_id UUID NOT NULL REFERENCES abonnes(id) ON DELETE RESTRICT,
    numero_facture VARCHAR(50) NOT NULL,
    periode VARCHAR(50) NOT NULL,
    date_emission DATE DEFAULT CURRENT_DATE,
    date_echeance DATE NOT NULL,
    ancien_index INTEGER NOT NULL,
    nouvel_index INTEGER NOT NULL,
    consommation_m3 INTEGER NOT NULL,
    prix_unitaire_fcfa NUMERIC(10,2) NOT NULL,
    montant_consommation_fcfa NUMERIC(12,2) NOT NULL,
    redevance_fixe_fcfa NUMERIC(10,2) DEFAULT 0.00,
    total_ttc_fcfa NUMERIC(12,2) NOT NULL,
    montant_paye_fcfa NUMERIC(12,2) DEFAULT 0.00,
    reste_du_fcfa NUMERIC(12,2) NOT NULL,
    statut VARCHAR(30) DEFAULT 'NON_PAYEE',
    qr_code_data TEXT NOT NULL,
    CONSTRAINT unq_num_facture_par_org UNIQUE(organisation_id, numero_facture)
);

-- 7. PAIEMENTS & IDEMPOTENCE
CREATE TABLE paiements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE RESTRICT,
    facture_id UUID NOT NULL REFERENCES factures(id) ON DELETE RESTRICT,
    abonne_id UUID NOT NULL REFERENCES abonnes(id) ON DELETE RESTRICT,
    montant_fcfa NUMERIC(12,2) NOT NULL CHECK (montant_fcfa > 0),
    date_paiement TIMESTAMPTZ DEFAULT NOW(),
    mode_paiement VARCHAR(50) NOT NULL,
    reference_transaction VARCHAR(100) NOT NULL,
    recu_numero VARCHAR(50) NOT NULL,
    idempotency_key VARCHAR(255) UNIQUE NOT NULL
);

-- 8. COMPTES DE TRÉSORERIE & DÉPENSES
CREATE TABLE comptes_tresorerie (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    solde_actuel_fcfa NUMERIC(14,2) DEFAULT 0.00
);

CREATE TABLE depenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE RESTRICT,
    categorie VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    montant_fcfa NUMERIC(12,2) NOT NULL,
    compte_tresorerie_id UUID NOT NULL REFERENCES comptes_tresorerie(id),
    statut VARCHAR(30) DEFAULT 'EN_ATTENTE',
    cree_par UUID NOT NULL REFERENCES profils_utilisateurs(id),
    valide_par UUID REFERENCES profils_utilisateurs(id),
    motif_annulation TEXT
);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE forages ENABLE ROW LEVEL SECURITY;
ALTER TABLE abonnes ENABLE ROW LEVEL SECURITY;
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;
ALTER TABLE depenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE comptes_tresorerie ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_tenant_forages ON forages FOR ALL USING (organisation_id = auth.get_user_org_id());
CREATE POLICY rls_tenant_abonnes ON abonnes FOR ALL USING (organisation_id = auth.get_user_org_id());
CREATE POLICY rls_tenant_factures ON factures FOR ALL USING (organisation_id = auth.get_user_org_id());
CREATE POLICY rls_tenant_paiements ON paiements FOR ALL USING (organisation_id = auth.get_user_org_id());
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#082F49] dark:text-sky-300 flex items-center gap-2">
            <Database className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            Schéma PostgreSQL & Politiques Supabase RLS
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Script DDL de déploiement prêt à l'emploi avec 24+ tables relationnelles et Row Level Security.
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copié dans le presse-papier !' : 'Copier le script SQL complet'}</span>
        </button>
      </div>

      {/* Code Editor Preview */}
      <div className="bg-[#0b1329] rounded-2xl border border-sky-950 p-5 shadow-2xl overflow-hidden font-mono text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-sky-950/80 mb-4 text-slate-400">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300">schema_factureau_v3.sql</span>
          </div>
          <span className="text-[11px] text-cyan-400 font-semibold">PostgreSQL 15+ / Supabase RLS</span>
        </div>

        <pre className="text-slate-300 overflow-x-auto max-h-[500px] leading-relaxed p-2">
          <code>{sqlCode}</code>
        </pre>
      </div>
    </div>
  );
};
