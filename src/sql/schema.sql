-- ============================================================================
-- FACTUREAU V3.0 - SCHÉMA POSTGRESQL & POLITIQUES ROW-LEVEL SECURITY (SUPABASE)
-- Architecture Multi-Tenant Sécurisée pour la Gestion des Forages et de l'Eau
-- ============================================================================

-- Extensions nécessaires
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RÔLES & PERMISSIONS
CREATE TYPE user_role_enum AS ENUM (
    'SUPER_ADMIN',
    'ADMIN_ORG',
    'ADMIN_FORAGE',
    'TRESORIER',
    'RELEVEUR',
    'FONTAINIER',
    'LECTEUR'
);

-- 3. PROFILS UTILISATEURS (LIÉS À SUPABASE AUTH.USERS)
CREATE TABLE profils_utilisateurs (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    telephone VARCHAR(50),
    role user_role_enum NOT NULL DEFAULT 'LECTEUR',
    statut VARCHAR(20) DEFAULT 'ACTIF' CHECK (statut IN ('ACTIF', 'SUSPENDU')),
    mfa_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_sign_in_at TIMESTAMPTZ
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unq_forage_code_par_org UNIQUE(organisation_id, code)
);

-- 5. AFFECTATIONS FORAGES AUX AGENTS
CREATE TABLE affectations_forages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    utilisateur_id UUID NOT NULL REFERENCES profils_utilisateurs(id) ON DELETE CASCADE,
    forage_id UUID NOT NULL REFERENCES forages(id) ON DELETE CASCADE,
    date_affectation TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unq_affectation UNIQUE(utilisateur_id, forage_id)
);

-- 6. ABONNÉS
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
    date_inscription DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unq_code_abonne_par_org UNIQUE(organisation_id, code_abonne)
);

-- 7. COMPTEURS
CREATE TABLE compteurs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE RESTRICT,
    forage_id UUID NOT NULL REFERENCES forages(id) ON DELETE RESTRICT,
    abonne_id UUID REFERENCES abonnes(id) ON DELETE SET NULL,
    numero_serie VARCHAR(100) NOT NULL,
    marque VARCHAR(100),
    diametre_mm INTEGER DEFAULT 15,
    date_installation DATE DEFAULT CURRENT_DATE,
    statut VARCHAR(30) DEFAULT 'ACTIF' CHECK (statut IN ('ACTIF', 'DEFECTUEUX', 'REMPLACE')),
    dernier_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unq_compteur_serie_par_org UNIQUE(organisation_id, numero_serie)
);

-- 8. RELEVÉS D'INDEX
CREATE TABLE releves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE RESTRICT,
    forage_id UUID NOT NULL REFERENCES forages(id) ON DELETE RESTRICT,
    abonne_id UUID NOT NULL REFERENCES abonnes(id) ON DELETE RESTRICT,
    compteur_id UUID NOT NULL REFERENCES compteurs(id) ON DELETE RESTRICT,
    date_releve DATE DEFAULT CURRENT_DATE,
    ancien_index INTEGER NOT NULL,
    nouvel_index INTEGER NOT NULL,
    consommation_m3 INTEGER GENERATED ALWAYS AS (nouvel_index - ancien_index) STORED,
    agent_id UUID REFERENCES profils_utilisateurs(id),
    statut VARCHAR(50) DEFAULT 'VALIDE' CHECK (statut IN ('VALIDE', 'ANOMALIE_SURCONSOMMATION', 'ANOMALIE_INDEX_INFERIEUR', 'CORRIGE')),
    motif_correction TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_index_coherence CHECK (nouvel_index >= ancien_index)
);

-- 9. FACTURES
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
    tva_fcfa NUMERIC(10,2) DEFAULT 0.00,
    total_ttc_fcfa NUMERIC(12,2) NOT NULL,
    montant_paye_fcfa NUMERIC(12,2) DEFAULT 0.00,
    reste_du_fcfa NUMERIC(12,2) NOT NULL,
    statut VARCHAR(30) DEFAULT 'NON_PAYEE' CHECK (statut IN ('NON_PAYEE', 'PARTIELLEMENT_PAYEE', 'PAYEE', 'EN_RETARD', 'ANNULEE')),
    qr_code_data TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unq_num_facture_par_org UNIQUE(organisation_id, numero_facture)
);

-- 10. COMPTES DE TRÉSORERIE
CREATE TABLE comptes_tresorerie (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL CHECK (type IN ('ESPECES', 'MOBILE_MONEY', 'BANQUE')),
    nom VARCHAR(100) NOT NULL,
    solde_actuel_fcfa NUMERIC(14,2) DEFAULT 0.00,
    numero_compte VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. PAIEMENTS (ENCAISSEMENTS FACTURES)
CREATE TABLE paiements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE RESTRICT,
    forage_id UUID NOT NULL REFERENCES forages(id) ON DELETE RESTRICT,
    facture_id UUID NOT NULL REFERENCES factures(id) ON DELETE RESTRICT,
    abonne_id UUID NOT NULL REFERENCES abonnes(id) ON DELETE RESTRICT,
    montant_fcfa NUMERIC(12,2) NOT NULL CHECK (montant_fcfa > 0),
    date_paiement TIMESTAMPTZ DEFAULT NOW(),
    mode_paiement VARCHAR(50) NOT NULL CHECK (mode_paiement IN ('WAVE', 'ORANGE_MONEY', 'PAYDUNYA', 'ESPECES', 'VIREMENT_BANCAIRE')),
    reference_transaction VARCHAR(100) NOT NULL,
    recu_numero VARCHAR(50) NOT NULL,
    encaisse_par UUID REFERENCES profils_utilisateurs(id),
    statut VARCHAR(30) DEFAULT 'CONFIRME' CHECK (statut IN ('CONFIRME', 'EN_ATTENTE', 'ECHOUE')),
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. DÉPENSES
CREATE TABLE depenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE RESTRICT,
    forage_id UUID REFERENCES forages(id) ON DELETE SET NULL,
    categorie VARCHAR(50) NOT NULL CHECK (categorie IN ('CARBURANT', 'ELECTRICITE', 'REPARATION', 'SALAIRE', 'ENTRETIEN', 'REDEVANCE', 'AUTRE')),
    description TEXT NOT NULL,
    montant_fcfa NUMERIC(12,2) NOT NULL CHECK (montant_fcfa > 0),
    date_depense DATE DEFAULT CURRENT_DATE,
    compte_tresorerie_id UUID NOT NULL REFERENCES comptes_tresorerie(id),
    justificatif_url TEXT,
    statut VARCHAR(30) DEFAULT 'EN_ATTENTE' CHECK (statut IN ('EN_ATTENTE', 'VALIDEE', 'ANNULEE')),
    cree_par UUID NOT NULL REFERENCES profils_utilisateurs(id),
    valide_par UUID REFERENCES profils_utilisateurs(id),
    date_validation TIMESTAMPTZ,
    motif_annulation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. MOUVEMENTS DE TRÉSORERIE (HISTORIQUE DES FLUX)
CREATE TABLE mouvements_tresorerie (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL CHECK (type IN ('ENCAISSEMENT', 'DECAISSEMENT', 'TRANSFERT_INTERNE', 'AJUSTEMENT')),
    compte_source_id UUID REFERENCES comptes_tresorerie(id),
    compte_dest_id UUID REFERENCES comptes_tresorerie(id),
    montant_fcfa NUMERIC(12,2) NOT NULL CHECK (montant_fcfa > 0),
    date_mouvement TIMESTAMPTZ DEFAULT NOW(),
    libelle VARCHAR(255) NOT NULL,
    reference_doc VARCHAR(100)
);

-- 14. BORNES-FONTAINES & VENTES
CREATE TABLE bornes_fontaines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    forage_id UUID NOT NULL REFERENCES forages(id) ON DELETE RESTRICT,
    code VARCHAR(50) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    quartier VARCHAR(150),
    fontainier_id UUID REFERENCES profils_utilisateurs(id),
    prix_bassine_fcfa NUMERIC(8,2) DEFAULT 25.00,
    volume_bassine_litres INTEGER DEFAULT 20,
    statut VARCHAR(30) DEFAULT 'ACTIF' CHECK (statut IN ('ACTIF', 'EN_PANNE', 'INACTIF'))
);

CREATE TABLE ventes_bornes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    borne_id UUID NOT NULL REFERENCES bornes_fontaines(id) ON DELETE CASCADE,
    date_vente DATE DEFAULT CURRENT_DATE,
    quantite_bassines INTEGER NOT NULL,
    total_vente_fcfa NUMERIC(10,2) NOT NULL,
    fontainier_id UUID NOT NULL REFERENCES profils_utilisateurs(id)
);

CREATE TABLE versements_fontainiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    borne_id UUID NOT NULL REFERENCES bornes_fontaines(id) ON DELETE CASCADE,
    fontainier_id UUID NOT NULL REFERENCES profils_utilisateurs(id),
    date_versement TIMESTAMPTZ DEFAULT NOW(),
    montant_verse_fcfa NUMERIC(10,2) NOT NULL,
    recu_numero VARCHAR(50) NOT NULL,
    recu_par UUID REFERENCES profils_utilisateurs(id),
    statut VARCHAR(20) DEFAULT 'VALIDE'
);

-- 15. PRODUCTION D'EAU
CREATE TABLE releves_production (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    forage_id UUID NOT NULL REFERENCES forages(id) ON DELETE CASCADE,
    date_releve DATE DEFAULT CURRENT_DATE,
    ancien_index_m3 INTEGER NOT NULL,
    nouvel_index_m3 INTEGER NOT NULL,
    volume_produit_m3 INTEGER GENERATED ALWAYS AS (nouvel_index_m3 - ancien_index_m3) STORED,
    agent_id UUID REFERENCES profils_utilisateurs(id),
    CONSTRAINT chk_prod_coherence CHECK (nouvel_index_m3 >= ancien_index_m3)
);

-- 16. PANNES & INTERVENTIONS
CREATE TABLE pannes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    forage_id UUID NOT NULL REFERENCES forages(id) ON DELETE CASCADE,
    titre VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    gravite VARCHAR(20) DEFAULT 'MOYENNE' CHECK (gravite IN ('HAUTE', 'MOYENNE', 'BASSE')),
    statut VARCHAR(20) DEFAULT 'SIGNALE' CHECK (statut IN ('SIGNALE', 'EN_COURS', 'REPARE')),
    signale_par UUID REFERENCES profils_utilisateurs(id),
    technicien_assigne VARCHAR(150),
    cout_reparation_fcfa NUMERIC(10,2) DEFAULT 0.00,
    depense_id UUID REFERENCES depenses(id),
    date_signalement TIMESTAMPTZ DEFAULT NOW(),
    date_resolution TIMESTAMPTZ
);

-- 17. COUPURES (VALIDATION HUMAINE OBLIGATOIRE)
CREATE TABLE coupures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    forage_id UUID NOT NULL REFERENCES forages(id) ON DELETE CASCADE,
    abonne_id UUID NOT NULL REFERENCES abonnes(id) ON DELETE CASCADE,
    montant_dette_fcfa NUMERIC(12,2) NOT NULL,
    delai_jours INTEGER DEFAULT 30,
    motif TEXT NOT NULL,
    date_proposition DATE DEFAULT CURRENT_DATE,
    statut VARCHAR(30) DEFAULT 'PROPOSE' CHECK (statut IN ('PROPOSE', 'VALIDEE', 'EFFECTUEE', 'RETABLIE', 'REJETEE')),
    valide_par UUID REFERENCES profils_utilisateurs(id),
    date_validation TIMESTAMPTZ,
    date_retablissement TIMESTAMPTZ
);

-- 18. JOURNAL D'AUDIT SÉCURISÉ
CREATE TABLE journal_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID REFERENCES organisations(id) ON DELETE SET NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    utilisateur_id UUID REFERENCES profils_utilisateurs(id) ON DELETE SET NULL,
    role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    module VARCHAR(100) NOT NULL,
    entite_id VARCHAR(100),
    details TEXT NOT NULL,
    adresse_ip VARCHAR(50),
    statut VARCHAR(30) DEFAULT 'SUCCES'
);

-- ============================================================================
-- SÉCURITÉ POSTGRESQL : ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Activer RLS sur toutes les tables sensibles
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE forages ENABLE ROW LEVEL SECURITY;
ALTER TABLE abonnes ENABLE ROW LEVEL SECURITY;
ALTER TABLE compteurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE releves ENABLE ROW LEVEL SECURITY;
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;
ALTER TABLE comptes_tresorerie ENABLE ROW LEVEL SECURITY;
ALTER TABLE depenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE mouvements_tresorerie ENABLE ROW LEVEL SECURITY;
ALTER TABLE bornes_fontaines ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventes_bornes ENABLE ROW LEVEL SECURITY;
ALTER TABLE releves_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE pannes ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupures ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_audit ENABLE ROW LEVEL SECURITY;

-- Helper function pour récupérer l'organisation_id du token JWT
CREATE OR REPLACE FUNCTION auth.get_user_org_id()
RETURNS UUID AS $$
  SELECT (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata' ->> 'organisation_id')::UUID;
$$ LANGUAGE SQL STABLE;

-- Helper function pour récupérer le rôle
CREATE OR REPLACE FUNCTION auth.get_user_role()
RETURNS VARCHAR AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata' ->> 'role';
$$ LANGUAGE SQL STABLE;

-- Politiques RLS d'isolation par tenant (Organisation A ne verra jamais Org B)
CREATE POLICY rls_forages_tenant_isolation ON forages
    FOR ALL
    USING (
        auth.get_user_role() = 'SUPER_ADMIN' OR
        organisation_id = auth.get_user_org_id()
    );

CREATE POLICY rls_abonnes_tenant_isolation ON abonnes
    FOR ALL
    USING (
        auth.get_user_role() = 'SUPER_ADMIN' OR
        organisation_id = auth.get_user_org_id()
    );

CREATE POLICY rls_factures_tenant_isolation ON factures
    FOR ALL
    USING (
        auth.get_user_role() = 'SUPER_ADMIN' OR
        organisation_id = auth.get_user_org_id()
    );

CREATE POLICY rls_paiements_tenant_isolation ON paiements
    FOR ALL
    USING (
        auth.get_user_role() = 'SUPER_ADMIN' OR
        organisation_id = auth.get_user_org_id()
    );

CREATE POLICY rls_depenses_tenant_isolation ON depenses
    FOR ALL
    USING (
        auth.get_user_role() = 'SUPER_ADMIN' OR (
            organisation_id = auth.get_user_org_id() AND
            auth.get_user_role() IN ('ADMIN_ORG', 'TRESORIER')
        )
    );

CREATE POLICY rls_tresorerie_tenant_isolation ON comptes_tresorerie
    FOR ALL
    USING (
        auth.get_user_role() = 'SUPER_ADMIN' OR (
            organisation_id = auth.get_user_org_id() AND
            auth.get_user_role() IN ('ADMIN_ORG', 'TRESORIER')
        )
    );
