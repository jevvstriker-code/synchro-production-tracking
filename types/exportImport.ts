export type DatabaseTableName =
  | 'app_users'
  | 'assembly_lines'
  | 'job_cards'
  | 'stage_logs'
  | 'rework_logs'
  | 'audit_trail';

export interface DataExportPackage {
  appName: string;
  version: string;
  schema: string;
  exportedAt: string;
  exportedBy?: string;
  summary: {
    totalRecords: number;
    tableCounts: Record<string, number>;
  };
  tables: {
    app_users?: any[];
    assembly_lines?: any[];
    job_cards?: any[];
    stage_logs?: any[];
    rework_logs?: any[];
    audit_trail?: any[];
    [key: string]: any[] | undefined;
  };
}

export type ImportMode = 'upsert' | 'append' | 'replace';

export interface ImportOptions {
  mode: ImportMode;
  selectedTables?: DatabaseTableName[];
  actorName?: string;
}

export interface TableValidationInfo {
  tableName: DatabaseTableName;
  count: number;
  sample?: any;
  warnings?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  metadata?: {
    appName?: string;
    version?: string;
    exportedAt?: string;
    schema?: string;
  };
  tablesDetected: Record<string, TableValidationInfo>;
  totalRecords: number;
  parsedTables: Record<string, any[]>;
}

export interface ImportProgress {
  stage: string;
  currentTable?: string;
  percent: number;
  message: string;
}

export interface TableImportResult {
  tableName: string;
  total: number;
  imported: number;
  failed: number;
  error?: string;
}

export interface ImportResult {
  success: boolean;
  durationMs: number;
  totalImported: number;
  totalFailed: number;
  tableResults: Record<string, TableImportResult>;
  error?: string;
}
