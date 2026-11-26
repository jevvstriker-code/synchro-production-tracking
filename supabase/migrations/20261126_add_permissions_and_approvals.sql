-- Migration: Add User Permissions and Admin Approval Queue
ALTER TABLE synchro_production_tracking.app_users 
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{
  "view_dashboard": true,
  "view_job_cards": true,
  "view_assembly_lines": true,
  "view_audit_trail": false,
  "view_rework": true,
  "view_reports": false,
  "view_team_performance": false,
  "can_create_job_cards": false,
  "can_update_stages": true,
  "can_log_rework": false,
  "requires_admin_approval": true
}'::jsonb;

-- Create approval_requests table
CREATE TABLE IF NOT EXISTS synchro_production_tracking.approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_type TEXT NOT NULL,
    job_card_no TEXT NOT NULL,
    panel_name TEXT,
    stage_name TEXT,
    requester_name TEXT NOT NULL,
    requester_role TEXT NOT NULL,
    requester_id UUID,
    action_payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Permissions & RLS
GRANT ALL ON TABLE synchro_production_tracking.approval_requests TO anon, authenticated, service_role;
ALTER TABLE synchro_production_tracking.approval_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'synchro_production_tracking' 
        AND tablename = 'approval_requests' 
        AND policyname = 'anon_approval_requests_all'
    ) THEN
        CREATE POLICY "anon_approval_requests_all" ON synchro_production_tracking.approval_requests FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;
END
$$;
