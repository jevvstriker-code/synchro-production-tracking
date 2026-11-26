import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eicforalejjzquoucbxp.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpY2ZvcmFsZWpqenF1b3VjYnhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NjI2MjMsImV4cCI6MjEwNjIzODYyM30.HUwFCmJ4qVx0fr1c7BOHPtefdfAjVkFhSw-CojXm-zs';
const schema = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || 'synchro_production_tracking';

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema },
});

const TABLES = [
  'app_users',
  'assembly_lines',
  'job_cards',
  'stage_logs',
  'rework_logs',
  'audit_trail'
];

async function runBackup() {
  console.log('Connecting to Supabase schema:', schema);
  const backupData = {
    metadata: {
      appName: 'Synchro Production Tracking',
      schema: schema,
      timestamp: new Date().toISOString(),
      version: '1.0'
    },
    tables: {}
  };

  for (const table of TABLES) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact' });

    if (error) {
      console.error(`Error backing up table ${table}:`, error);
      throw error;
    }
    console.log(`Table ${table}: fetched ${data.length} records (count: ${count})`);
    backupData.tables[table] = data;
  }

  const backupDir = path.resolve(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup_synchro_production_tracking_${timestampStr}.json`;
  const filePath = path.join(backupDir, filename);

  fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`\nBackup saved successfully to: ${filePath}`);

  // Also write latest backup copy
  const latestFilePath = path.join(backupDir, 'latest_backup.json');
  fs.writeFileSync(latestFilePath, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`Latest backup copy updated: ${latestFilePath}`);
}

runBackup().catch((err) => {
  console.error('Backup failed:', err);
  process.exit(1);
});
