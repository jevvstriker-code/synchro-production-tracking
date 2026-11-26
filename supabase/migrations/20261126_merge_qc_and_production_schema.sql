-- Migration: Merge QC App and Production Tracking
-- Date: 2026-11-26

-- 1. Update app_users constraint to support qc_inspector, dashboard_viewer, and developer
ALTER TABLE synchro_production_tracking.app_users 
  DROP CONSTRAINT IF EXISTS app_users_role_check;

ALTER TABLE synchro_production_tracking.app_users 
  ADD CONSTRAINT app_users_role_check 
  CHECK (role = ANY (ARRAY[
    'admin'::text, 
    'supervisor'::text, 
    'fitter'::text, 
    'ppc'::text, 
    'qc_inspector'::text, 
    'dashboard_viewer'::text, 
    'developer'::text
  ]));

-- 2. Add department column if not present
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'synchro_production_tracking' 
      AND table_name = 'app_users' 
      AND column_name = 'department'
  ) THEN
    ALTER TABLE synchro_production_tracking.app_users ADD COLUMN department text DEFAULT 'Production';
  END IF;
END $$;

-- 3. Add job_card_no to synchro_qc_app tables if not present
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'synchro_qc_app' 
      AND table_name = 'qc_records' 
      AND column_name = 'job_card_no'
  ) THEN
    ALTER TABLE synchro_qc_app.qc_records ADD COLUMN job_card_no text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'synchro_qc_app' 
      AND table_name = 'reworks' 
      AND column_name = 'job_card_no'
  ) THEN
    ALTER TABLE synchro_qc_app.reworks ADD COLUMN job_card_no text;
  END IF;
END $$;

-- 4. Add stage timer pause/resume columns to stage_logs
ALTER TABLE synchro_production_tracking.stage_logs 
  ADD COLUMN IF NOT EXISTS is_timer_paused boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS accumulated_seconds integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_resumed_at timestamp with time zone;

