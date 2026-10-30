-- Dedicated PostgreSQL Schema for Synchro Electricals Production Tracking
CREATE SCHEMA IF NOT EXISTS synchro_production_tracking;

-- Permissions to Supabase roles
GRANT USAGE ON SCHEMA synchro_production_tracking TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA synchro_production_tracking TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA synchro_production_tracking TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA synchro_production_tracking TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA synchro_production_tracking GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA synchro_production_tracking GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA synchro_production_tracking GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- Expose to PostgREST
ALTER ROLE authenticator SET pgrst.db_schemas = 'public, synchro_qc_app, lexicon_polycraft_app, keep_todo_app, synchro_production_tracking';
NOTIFY pgrst, 'reload config';

-- 1. App Users (Admins, Supervisors, Fitters, PPC)
CREATE TABLE IF NOT EXISTS synchro_production_tracking.app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'supervisor', 'fitter', 'ppc')),
    pin_code TEXT NOT NULL,
    password TEXT NOT NULL,
    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Job Cards (Panels)
CREATE TABLE IF NOT EXISTS synchro_production_tracking.job_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_card_no TEXT UNIQUE NOT NULL,
    customer_code TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    lot_qty INTEGER NOT NULL DEFAULT 1,
    product_name TEXT NOT NULL,
    panel_type TEXT NOT NULL DEFAULT 'Indoor',
    assembly_line TEXT NOT NULL,
    current_stage TEXT NOT NULL DEFAULT 'Material Issue',
    current_stage_idx INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'delayed', 'completed', 'dispatched')),
    production_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    production_end_date DATE,
    ppc_name TEXT NOT NULL,
    supervisor_name TEXT NOT NULL,
    assigned_fitter_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Stage Logs (11 Industrial Stages)
CREATE TABLE IF NOT EXISTS synchro_production_tracking.stage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_card_id UUID NOT NULL REFERENCES synchro_production_tracking.job_cards(id) ON DELETE CASCADE,
    stage_index INTEGER NOT NULL,
    stage_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed')),
    start_date DATE,
    start_time TIME,
    started_at TIMESTAMPTZ,
    end_date DATE,
    end_time TIME,
    completed_at TIMESTAMPTZ,
    duration_hours NUMERIC(6,2),
    duration_display TEXT,
    operator_name TEXT,
    delay_reason TEXT NOT NULL DEFAULT 'None',
    delay_notes TEXT,
    is_admin_override BOOLEAN NOT NULL DEFAULT false,
    admin_override_reason TEXT,
    admin_override_by TEXT,
    admin_override_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_job_card_stage UNIQUE (job_card_id, stage_index)
);

-- 4. Rework & Rejection Logs
CREATE TABLE IF NOT EXISTS synchro_production_tracking.rework_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_card_no TEXT NOT NULL,
    product_name TEXT NOT NULL,
    assembly_line TEXT NOT NULL,
    process_name TEXT NOT NULL,
    reason TEXT NOT NULL,
    supervisor_name TEXT NOT NULL,
    corrective_action TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Audit Trail
CREATE TABLE IF NOT EXISTS synchro_production_tracking.audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    job_card_no TEXT NOT NULL,
    action TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    actor_role TEXT,
    details TEXT,
    ip_address TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stage_logs_job_card_id ON synchro_production_tracking.stage_logs(job_card_id);
CREATE INDEX IF NOT EXISTS idx_stage_logs_operator ON synchro_production_tracking.stage_logs(operator_name);
CREATE INDEX IF NOT EXISTS idx_job_cards_jc_no ON synchro_production_tracking.job_cards(job_card_no);
CREATE INDEX IF NOT EXISTS idx_job_cards_assembly_line ON synchro_production_tracking.job_cards(assembly_line);
CREATE INDEX IF NOT EXISTS idx_job_cards_status ON synchro_production_tracking.job_cards(status);
CREATE INDEX IF NOT EXISTS idx_audit_trail_jc_no ON synchro_production_tracking.audit_trail(job_card_no);
CREATE INDEX IF NOT EXISTS idx_rework_logs_jc_no ON synchro_production_tracking.rework_logs(job_card_no);

-- RLS & Policies
ALTER TABLE synchro_production_tracking.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE synchro_production_tracking.job_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE synchro_production_tracking.stage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE synchro_production_tracking.rework_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE synchro_production_tracking.audit_trail ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_job_cards_all" ON synchro_production_tracking.job_cards FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_stage_logs_all" ON synchro_production_tracking.stage_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_rework_logs_all" ON synchro_production_tracking.rework_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_audit_trail_all" ON synchro_production_tracking.audit_trail FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_app_users_all" ON synchro_production_tracking.app_users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
