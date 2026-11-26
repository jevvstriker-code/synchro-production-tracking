import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eicforalejjzquoucbxp.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpY2ZvcmFsZWpqenF1b3VjYnhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NjI2MjMsImV4cCI6MjEwNjIzODYyM30.HUwFCmJ4qVx0fr1c7BOHPtefdfAjVkFhSw-CojXm-zs';

const prodClient = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'synchro_production_tracking' },
});

const qcClient = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'synchro_qc_app' },
});

const PROD_TABLES = [
  'app_users',
  'assembly_lines',
  'job_cards',
  'stage_logs',
  'rework_logs',
  'audit_trail',
  'approval_requests',
];

const QC_TABLES = [
  'users',
  'qc_logs',
  'qc_records',
  'reworks',
  'weekly_objectives',
];

async function runDualBackup() {
  console.log('=== Starting Complete Dual Backup (Production & QC) ===');
  const backupData = {
    metadata: {
      appName: 'Synchro Merged Production & QC Management',
      timestamp: new Date().toISOString(),
      supabaseUrl,
      version: '2.0-pre-merge',
    },
    production_tracking: {},
    qc_management: {},
  };

  console.log('\n--- Backing up Production Tracking schema ---');
  for (const table of PROD_TABLES) {
    const { data, error, count } = await prodClient
      .from(table)
      .select('*', { count: 'exact' });

    if (error) {
      console.error(`Error in table ${table}:`, error.message);
      backupData.production_tracking[table] = [];
    } else {
      console.log(`[Production] ${table}: ${data.length} records`);
      backupData.production_tracking[table] = data;
    }
  }

  console.log('\n--- Backing up QC Management schema ---');
  for (const table of QC_TABLES) {
    const { data, error, count } = await qcClient
      .from(table)
      .select('*', { count: 'exact' });

    if (error) {
      console.error(`Error in table ${table}:`, error.message);
      backupData.qc_management[table] = [];
    } else {
      console.log(`[QC] ${table}: ${data.length} records`);
      backupData.qc_management[table] = data;
    }
  }

  const backupDirs = [
    path.resolve(process.cwd(), 'backups'),
    path.resolve('c:/IND DR/WEB APP/SYNCHRO/backups'),
  ];

  const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup_synchro_prod_and_qc_${timestampStr}.json`;

  for (const dir of backupDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const fullPath = path.join(dir, filename);
    const latestPath = path.join(dir, 'latest_both_backup.json');
    fs.writeFileSync(fullPath, JSON.stringify(backupData, null, 2), 'utf8');
    fs.writeFileSync(latestPath, JSON.stringify(backupData, null, 2), 'utf8');
    console.log(`Saved backup to: ${fullPath}`);
    console.log(`Saved latest to: ${latestPath}`);
  }

  console.log('\n=== Dual Backup Completed Successfully! ===');
}

runDualBackup().catch((e) => {
  console.error('Dual backup failed', e);
  process.exit(1);
});
