export type QCStatus = 'Accepted' | 'Rework' | 'Rejected';
export type QCStage = 'Incoming QC' | 'In-Process QC' | 'Final QC';
export type InOutType = 'Indoor' | 'Outdoor' | 'N/A';
export type DefectType = 'Rework' | 'Rejected';
export type VerificationStatus = 'Pending' | 'OK';

export interface QCRecord {
  id: string;
  log_id: string;
  stage: QCStage | string;
  item_name: string;
  category: string;
  in_out: InOutType | string;
  serial_no: string;
  job_card_no?: string | null;
  team_vendor: string;
  client: string;
  qty: number;
  docs: string;
  inspection_time: string;
  status: QCStatus;
  remarks: string;
  created_at?: string;
}

export interface ReworkRecord {
  id: string;
  log_id: string;
  qc_record_id?: string | null;
  job_card_no?: string | null;
  issue_date: string;
  item_name: string;
  team_vendor: string;
  stage: string;
  defect_type: DefectType;
  qty: number;
  reason: string;
  root_cause: string;
  action_taken: string;
  corrective_action: string;
  verification_status: VerificationStatus;
  created_at?: string;
  updated_at?: string;
}

export interface WeeklyObjective {
  id?: string;
  log_id?: string;
  objective_no: number;
  objective_text: string;
  completed_status: string;
  remarks: string;
  created_at?: string;
}

export interface QCLog {
  id: string;
  entry_date: string;
  employee_name: string;
  department: string;
  is_weekly: boolean;
  week_ending?: string;
  highlights?: string;
  challenges?: string;
  next_plan?: string;
  support?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  qc_records?: QCRecord[];
  reworks?: ReworkRecord[];
  weekly_objectives?: WeeklyObjective[];
}

export interface DefectDraft {
  stage: string;
  qty: number;
  reason: string;
  rootcause: string;
  action: string;
  corrective: string;
  verification: VerificationStatus;
  job_card_no?: string;
}

export interface QCDashboardMetrics {
  totalQCItems: number;
  totalDefects: number;
  defectRate: number;
  passRate: number;
  verifiedOKCount: number;
  pendingDefectsCount: number;
  processWiseDefects: Record<string, number>;
  stageWiseInspections: Record<string, number>;
  logs: QCLog[];
}
