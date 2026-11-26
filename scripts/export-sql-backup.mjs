import fs from 'fs';
import path from 'path';

const latestBackup = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'backups', 'latest_backup.json'), 'utf8'));

let sql = `-- Synchro Production Tracking Database SQL Backup
-- Generated at: ${latestBackup.metadata.timestamp}
-- Schema: ${latestBackup.metadata.schema}

CREATE SCHEMA IF NOT EXISTS synchro_production_tracking;

`;

function formatVal(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
  return `'${String(v).replace(/'/g, "''")}'`;
}

for (const [table, rows] of Object.entries(latestBackup.tables)) {
  if (!rows || rows.length === 0) continue;
  sql += `-- Table: synchro_production_tracking.${table} (${rows.length} rows)\n`;
  const cols = Object.keys(rows[0]);
  const colList = cols.map(c => `"${c}"`).join(', ');

  for (const row of rows) {
    const vals = cols.map(c => formatVal(row[c])).join(', ');
    sql += `INSERT INTO synchro_production_tracking."${table}" (${colList}) VALUES (${vals}) ON CONFLICT DO NOTHING;\n`;
  }
  sql += '\n';
}

const sqlPath = path.join(process.cwd(), 'backups', 'backup_synchro_production_tracking_latest.sql');
fs.writeFileSync(sqlPath, sql, 'utf8');
console.log(`SQL backup written to ${sqlPath}`);
