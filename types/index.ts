export type UserRole = 'admin' | 'supervisor' | 'fitter' | 'ppc';

export interface AppUser {
  id: string;
  username: string;
  full_name: string;
  role: UserRole;
  pin_code: string;
  phone?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type PanelStatus = 'in_progress' | 'delayed' | 'completed' | 'dispatched';

export interface JobCard {
  id: string;
  job_card_no: string;
  customer_code: string;
  date: string;
  lot_qty: number;
  product_name: string;
  panel_type: string;
  assembly_line: string;
  assemblyLine: string;
  current_stage: string;
  current_stage_idx: number;
  status: PanelStatus;
  production_start_date: string;
  production_end_date: string | null;
  ppc_name: string;
  supervisor_name: string;
  assigned_fitter_name?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type StageStatus = 'pending' | 'in_progress' | 'completed' | 'delayed';

export interface StageLog {
  id: string;
  job_card_id: string;
  stage_index: number;
  stage_name: string;
  status: StageStatus;
  start_date?: string | null;
  start_time?: string | null;
  started_at?: string | null;
  end_date?: string | null;
  end_time?: string | null;
  completed_at?: string | null;
  duration_hours?: number | null;
  duration_display?: string | null;
  operator_name?: string | null;
  delay_reason: string;
  delay_notes?: string | null;
  is_admin_override: boolean;
  admin_override_reason?: string | null;
  admin_override_by?: string | null;
  admin_override_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ReworkLog {
  id: string;
  job_card_no: string;
  product_name: string;
  assembly_line: string;
  process_name: string;
  reason: string;
  supervisor_name: string;
  corrective_action?: string | null;
  created_at?: string;
}

export interface AuditTrail {
  id: string;
  timestamp: string;
  job_card_no: string;
  action: string;
  actor_name: string;
  actor_role?: string | null;
  details?: string | null;
  ip_address?: string | null;
}

export interface ProductionStageDef {
  name: string;
  description: string;
  standardDurationHrs: number;
}

export const PRODUCTION_STAGES: ProductionStageDef[] = [
  { name: "Material Issue", description: "Raw material & component verification from inventory", standardDurationHrs: 2 },
  { name: "Fabrication Assembly", description: "Enclosure sheet metal fabrication, alignment & welding", standardDurationHrs: 4 },
  { name: "Switch Gear Mounting", description: "Circuit breakers, contactors & relays placement", standardDurationHrs: 3 },
  { name: "Busbar Assembly", description: "Copper/aluminum busbar cutting, bending, sleeving & torquing", standardDurationHrs: 4 },
  { name: "Wiring", description: "Control, power & auxiliary harness wiring and ferrule marking", standardDurationHrs: 5 },
  { name: "Isolation Work", description: "Phase barriers, shrouding, clearances & creepage protection", standardDurationHrs: 2 },
  { name: "Testing", description: "Dielectric HV test, insulation resistance, secondary injection", standardDurationHrs: 3 },
  { name: "Label / Sticker Fixing", description: "Warning labels, terminal markers, mimic diagrams & rating plates", standardDurationHrs: 1 },
  { name: "Packing", description: "Polythene wrapping, edge cushioning & wooden crating", standardDurationHrs: 2 },
  { name: "Customer Confirmation for Dispatch", description: "Pre-dispatch inspection report & customer clearance approval", standardDurationHrs: 1 },
  { name: "Dispatch", description: "Gate pass generation, vehicle loading & handover", standardDurationHrs: 1 }
];

export const DELAY_REASONS = [
  "None",
  "Material Shortage / Delay",
  "Fabrication Complexity / Alignment",
  "Switchgear Delivery Delay",
  "Busbar Bending / Fitting Issue",
  "Wiring Complexity / Layout Issue",
  "Testing Failure / Rework",
  "Customer Approval Pending",
  "Operator Shift Change / Shortage",
  "Tooling / Calibration Downtime"
];

export const ASSEMBLY_LINES = [
  "Assembly Line 1",
  "Assembly Line 2",
  "Assembly Line 3",
  "Assembly Line 4",
  "Assembly Line 5",
  "Assembly Line 6",
  "Assembly Line 7"
];
