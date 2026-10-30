-- Migration: Add assembly_lines table
CREATE TABLE IF NOT EXISTS synchro_production_tracking.assembly_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    line_code TEXT,
    description TEXT,
    supervisor_name TEXT,
    capacity INTEGER DEFAULT 10,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE synchro_production_tracking.assembly_lines ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'synchro_production_tracking' 
        AND tablename = 'assembly_lines' 
        AND policyname = 'anon_assembly_lines_all'
    ) THEN
        CREATE POLICY "anon_assembly_lines_all" ON synchro_production_tracking.assembly_lines FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;
END
$$;

INSERT INTO synchro_production_tracking.assembly_lines (name, line_code, description, supervisor_name, capacity, display_order)
VALUES
('Assembly Line 1', 'AL-01', 'PCC & Main Power Distribution Panels', 'Amit Sharma', 10, 1),
('Assembly Line 2', 'AL-02', 'MCC & Motor Control Centers', 'Amit Sharma', 8, 2),
('Assembly Line 3', 'AL-03', 'APFC & Capacitor Bank Panels', 'Sandeep Verma', 8, 3),
('Assembly Line 4', 'AL-04', 'VFD & Automation Control Desks', 'Sandeep Verma', 6, 4),
('Assembly Line 5', 'AL-05', 'Synchronizing & DG Auto Panels', 'Amit Sharma', 6, 5),
('Assembly Line 6', 'AL-06', 'PLC, SCADA & Instrumentation Panels', 'Sandeep Verma', 8, 6),
('Assembly Line 7', 'AL-07', 'Feeder Pillars & Distribution Boards', 'Amit Sharma', 12, 7)
ON CONFLICT (name) DO NOTHING;
