import { supabase } from '@/lib/supabase/client';
import {
  DatabaseTableName,
  DataExportPackage,
  ImportMode,
  ImportOptions,
  ValidationResult,
  ImportProgress,
  ImportResult,
  TableValidationInfo,
} from '@/types/exportImport';

export const ALL_TABLES: DatabaseTableName[] = [
  'app_users',
  'assembly_lines',
  'job_cards',
  'stage_logs',
  'rework_logs',
  'audit_trail',
];

export const TABLE_METADATA: Record<
  DatabaseTableName,
  {
    displayName: string;
    description: string;
    conflictKey: string;
    validColumns: string[];
  }
> = {
  app_users: {
    displayName: 'Staff Accounts & Operators',
    description: 'Admins, supervisors, fitters, PPC logins and PIN codes',
    conflictKey: 'id',
    validColumns: [
      'id',
      'username',
      'full_name',
      'role',
      'pin_code',
      'password',
      'phone',
      'is_active',
      'created_at',
      'updated_at',
    ],
  },
  assembly_lines: {
    displayName: 'Assembly Lines & Workstations',
    description: 'Manufacturing lines, capacities, and active floor routing',
    conflictKey: 'id',
    validColumns: [
      'id',
      'name',
      'line_code',
      'description',
      'supervisor_name',
      'capacity',
      'is_active',
      'display_order',
      'created_at',
      'updated_at',
    ],
  },
  job_cards: {
    displayName: 'Job Cards & Panels',
    description: 'Electrical panel batches, customer codes, and current stages',
    conflictKey: 'id',
    validColumns: [
      'id',
      'job_card_no',
      'customer_code',
      'date',
      'lot_qty',
      'product_name',
      'panel_type',
      'assembly_line',
      'current_stage',
      'current_stage_idx',
      'status',
      'production_start_date',
      'production_end_date',
      'ppc_name',
      'supervisor_name',
      'assigned_fitter_name',
      'created_at',
      'updated_at',
    ],
  },
  stage_logs: {
    displayName: 'Production Stage Logs',
    description: '11 industrial production stages, timestamps, and durations',
    conflictKey: 'id',
    validColumns: [
      'id',
      'job_card_id',
      'stage_index',
      'stage_name',
      'status',
      'start_date',
      'start_time',
      'started_at',
      'end_date',
      'end_time',
      'completed_at',
      'duration_hours',
      'duration_display',
      'operator_name',
      'delay_reason',
      'delay_notes',
      'is_admin_override',
      'admin_override_reason',
      'admin_override_by',
      'admin_override_at',
      'created_at',
      'updated_at',
    ],
  },
  rework_logs: {
    displayName: 'Rework & Rejection Logs',
    description: 'Defect incidents, quality rejections, and corrective actions',
    conflictKey: 'id',
    validColumns: [
      'id',
      'job_card_no',
      'product_name',
      'assembly_line',
      'process_name',
      'reason',
      'supervisor_name',
      'corrective_action',
      'created_at',
    ],
  },
  audit_trail: {
    displayName: 'Activity Audit Trail',
    description: 'Tamper-evident logs of user activities and stage overrides',
    conflictKey: 'id',
    validColumns: [
      'id',
      'timestamp',
      'job_card_no',
      'action',
      'actor_name',
      'actor_role',
      'details',
      'ip_address',
    ],
  },
};

// Dependency order for importing (foreign keys require job_cards before stage_logs)
export const IMPORT_ORDER: DatabaseTableName[] = [
  'app_users',
  'assembly_lines',
  'job_cards',
  'stage_logs',
  'rework_logs',
  'audit_trail',
];

// Reverse order for cleaning tables when in replace mode
export const DELETE_ORDER: DatabaseTableName[] = [
  'stage_logs',
  'rework_logs',
  'audit_trail',
  'job_cards',
  'assembly_lines',
  'app_users',
];

export const dataExportImportService = {
  /**
   * Get row counts for all database tables
   */
  async getTableCounts(): Promise<Record<DatabaseTableName, number>> {
    const counts: Partial<Record<DatabaseTableName, number>> = {};
    for (const table of ALL_TABLES) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        counts[table] = error ? 0 : count || 0;
      } catch {
        counts[table] = 0;
      }
    }
    return counts as Record<DatabaseTableName, number>;
  },

  /**
   * Export database tables as a structured JSON package
   */
  async exportTables(
    tablesToExport: DatabaseTableName[] = ALL_TABLES,
    actorName?: string
  ): Promise<DataExportPackage> {
    const tableCounts: Record<string, number> = {};
    const tablesData: Record<string, any[]> = {};
    let totalRecords = 0;

    for (const table of tablesToExport) {
      const { data, error } = await supabase
        .from(table)
        .select('*');

      if (error) {
        console.error(`Error querying table ${table} for export:`, error);
        throw new Error(`Failed to export table ${table}: ${error.message}`);
      }

      const rows = data || [];
      tablesData[table] = rows;
      tableCounts[table] = rows.length;
      totalRecords += rows.length;
    }

    const exportPackage: DataExportPackage = {
      appName: 'Synchro Production Tracking',
      version: '1.0',
      schema: 'synchro_production_tracking',
      exportedAt: new Date().toISOString(),
      exportedBy: actorName || 'System User',
      summary: {
        totalRecords,
        tableCounts,
      },
      tables: tablesData,
    };

    return exportPackage;
  },

  /**
   * Trigger download of a JSON object in the browser
   */
  downloadJsonFile(data: any, fileName?: string): void {
    if (typeof window === 'undefined') return;

    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const defaultName = `synchro_production_backup_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`;
    const finalName = fileName || defaultName;

    const link = document.createElement('a');
    link.href = url;
    link.download = finalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Validate and parse an uploaded JSON file content
   */
  validateImportJson(jsonText: string): ValidationResult {
    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e: any) {
      return {
        isValid: false,
        error: `Invalid JSON syntax: ${e.message}`,
        tablesDetected: {},
        totalRecords: 0,
        parsedTables: {},
      };
    }

    const tablesDetected: Record<string, TableValidationInfo> = {};
    const parsedTables: Record<string, any[]> = {};
    let totalRecords = 0;

    // Detect format
    if (Array.isArray(parsed)) {
      // Format: Direct array of records for a single table
      if (parsed.length === 0) {
        return {
          isValid: false,
          error: 'The uploaded JSON array contains zero records.',
          tablesDetected: {},
          totalRecords: 0,
          parsedTables: {},
        };
      }

      const firstItem = parsed[0];
      let inferredTable: DatabaseTableName = 'job_cards';

      if ('stage_name' in firstItem || 'stage_index' in firstItem) {
        inferredTable = 'stage_logs';
      } else if ('job_card_no' in firstItem && 'product_name' in firstItem && !('current_stage' in firstItem)) {
        inferredTable = 'rework_logs';
      } else if ('job_card_no' in firstItem) {
        inferredTable = 'job_cards';
      } else if ('pin_code' in firstItem || 'username' in firstItem) {
        inferredTable = 'app_users';
      } else if ('line_code' in firstItem || ('capacity' in firstItem && 'name' in firstItem)) {
        inferredTable = 'assembly_lines';
      } else if ('action' in firstItem && 'actor_name' in firstItem) {
        inferredTable = 'audit_trail';
      }

      parsedTables[inferredTable] = parsed;
      tablesDetected[inferredTable] = {
        tableName: inferredTable,
        count: parsed.length,
        sample: firstItem,
      };
      totalRecords = parsed.length;
    } else if (typeof parsed === 'object' && parsed !== null) {
      // Format: Full export package or map of tables
      const candidateTables = parsed.tables && typeof parsed.tables === 'object'
        ? parsed.tables
        : parsed;

      for (const table of ALL_TABLES) {
        if (candidateTables[table] && Array.isArray(candidateTables[table])) {
          const rows = candidateTables[table];
          parsedTables[table] = rows;
          tablesDetected[table] = {
            tableName: table,
            count: rows.length,
            sample: rows[0] || null,
          };
          totalRecords += rows.length;
        }
      }
    }

    if (totalRecords === 0) {
      return {
        isValid: false,
        error: 'No recognized table data found in JSON. Expected tables: ' + ALL_TABLES.join(', '),
        tablesDetected: {},
        totalRecords: 0,
        parsedTables: {},
      };
    }

    return {
      isValid: true,
      metadata: {
        appName: parsed?.appName,
        version: parsed?.version,
        exportedAt: parsed?.exportedAt,
        schema: parsed?.schema,
      },
      tablesDetected,
      totalRecords,
      parsedTables,
    };
  },

  /**
   * Sanitize row data against whitelisted Postgres columns
   */
  sanitizeRow(tableName: DatabaseTableName, row: any): any {
    const meta = TABLE_METADATA[tableName];
    if (!meta) return row;

    const sanitized: any = {};

    // Specific conversions
    if (tableName === 'job_cards') {
      if (row.assemblyLine && !row.assembly_line) {
        row.assembly_line = row.assemblyLine;
      }
    }

    for (const col of meta.validColumns) {
      if (row[col] !== undefined) {
        sanitized[col] = row[col];
      }
    }

    return sanitized;
  },

  /**
   * Import parsed data into Supabase
   */
  async importData(
    parsedTables: Record<string, any[]>,
    options: ImportOptions,
    onProgress?: (progress: ImportProgress) => void
  ): Promise<ImportResult> {
    const startTime = Date.now();
    const mode = options.mode || 'upsert';
    const selectedTables = options.selectedTables || ALL_TABLES;

    const tableResults: Record<string, any> = {};
    let totalImported = 0;
    let totalFailed = 0;

    // Handle 'replace' mode by deleting in reverse dependency order
    if (mode === 'replace') {
      onProgress?.({
        stage: 'cleaning',
        percent: 5,
        message: 'Clearing selected tables for clean replace...',
      });

      for (const table of DELETE_ORDER) {
        if (selectedTables.includes(table) && parsedTables[table]) {
          try {
            // Delete all records in table
            const { error: delErr } = await supabase
              .from(table)
              .delete()
              .neq('id', '00000000-0000-0000-0000-000000000000'); // match all rows

            if (delErr) {
              console.warn(`Warning while clearing table ${table}:`, delErr);
            }
          } catch (e) {
            console.warn(`Error clearing table ${table}:`, e);
          }
        }
      }
    }

    // Process tables in correct dependency order
    const tablesToProcess = IMPORT_ORDER.filter(
      (t) => selectedTables.includes(t) && parsedTables[t] && parsedTables[t].length > 0
    );

    const totalSteps = tablesToProcess.length;
    let completedSteps = 0;

    for (const table of tablesToProcess) {
      const rows = parsedTables[table];
      const meta = TABLE_METADATA[table];
      let importedCount = 0;
      let failedCount = 0;
      let lastError: string | undefined;

      onProgress?.({
        stage: 'importing',
        currentTable: table,
        percent: Math.round((completedSteps / totalSteps) * 100),
        message: `Importing ${rows.length} records into ${meta.displayName}...`,
      });

      // Sanitize rows
      const sanitizedRows = rows.map((r) => this.sanitizeRow(table, r));

      // Batch in chunks of 50
      const BATCH_SIZE = 50;
      for (let i = 0; i < sanitizedRows.length; i += BATCH_SIZE) {
        const batch = sanitizedRows.slice(i, i + BATCH_SIZE);

        try {
          if (mode === 'append') {
            // Insert, ignore duplicates
            const { error } = await supabase
              .from(table)
              .upsert(batch, { onConflict: meta.conflictKey, ignoreDuplicates: true });

            if (error) {
              // Try standard insert if onConflict fails
              const { error: insErr } = await supabase.from(table).insert(batch);
              if (insErr) {
                console.error(`Batch insert error in ${table}:`, insErr);
                failedCount += batch.length;
                lastError = insErr.message;
              } else {
                importedCount += batch.length;
              }
            } else {
              importedCount += batch.length;
            }
          } else {
            // 'upsert' or 'replace' -> upsert merge
            const { error } = await supabase
              .from(table)
              .upsert(batch, { onConflict: meta.conflictKey, ignoreDuplicates: false });

            if (error) {
              console.error(`Batch upsert error in ${table}:`, error);
              // Fallback to item-by-item to salvage partial batch
              for (const item of batch) {
                const { error: singleErr } = await supabase
                  .from(table)
                  .upsert([item], { onConflict: meta.conflictKey, ignoreDuplicates: false });
                if (singleErr) {
                  failedCount++;
                  lastError = singleErr.message;
                } else {
                  importedCount++;
                }
              }
            } else {
              importedCount += batch.length;
            }
          }
        } catch (err: any) {
          console.error(`Unexpected error inserting batch into ${table}:`, err);
          failedCount += batch.length;
          lastError = err.message;
        }

        const batchPercent = Math.min(
          99,
          Math.round(((completedSteps + (i + batch.length) / sanitizedRows.length) / totalSteps) * 100)
        );
        onProgress?.({
          stage: 'importing',
          currentTable: table,
          percent: batchPercent,
          message: `Processed ${Math.min(i + BATCH_SIZE, sanitizedRows.length)} / ${sanitizedRows.length} in ${meta.displayName}...`,
        });
      }

      completedSteps++;
      totalImported += importedCount;
      totalFailed += failedCount;

      tableResults[table] = {
        tableName: table,
        total: rows.length,
        imported: importedCount,
        failed: failedCount,
        error: lastError,
      };
    }

    // Log the import to the audit trail
    try {
      await supabase.from('audit_trail').insert({
        job_card_no: 'SYSTEM_IMPORT',
        action: 'Database JSON Import',
        actor_name: options.actorName || 'User',
        actor_role: 'admin',
        details: `Imported ${totalImported} records across ${tablesToProcess.length} tables in mode: ${mode}. Failed: ${totalFailed}.`,
      });
    } catch (e) {
      console.warn('Could not write audit trail for import:', e);
    }

    onProgress?.({
      stage: 'done',
      percent: 100,
      message: `Import complete! ${totalImported} records processed.`,
    });

    const durationMs = Date.now() - startTime;
    return {
      success: totalFailed === 0,
      durationMs,
      totalImported,
      totalFailed,
      tableResults,
    };
  },
};
