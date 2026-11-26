'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  Upload,
  Database,
  FileJson,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Layers,
  Users,
  ShieldCheck,
  FileText,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  HardDriveDownload,
  HardDriveUpload,
  Info,
} from 'lucide-react';
import {
  dataExportImportService,
  ALL_TABLES,
  TABLE_METADATA,
} from '@/services/dataExportImportService';
import {
  DatabaseTableName,
  DataExportPackage,
  ImportMode,
  ValidationResult,
  ImportProgress,
  ImportResult,
} from '@/types/exportImport';
import { useAuth } from '@/components/AuthContext';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialTab?: 'export' | 'import';
}

const TABLE_ICONS: Record<DatabaseTableName, React.ElementType> = {
  job_cards: Layers,
  stage_logs: FileText,
  assembly_lines: Database,
  app_users: Users,
  rework_logs: AlertTriangle,
  audit_trail: ShieldCheck,
};

export function ImportExportModal({
  isOpen,
  onClose,
  onSuccess,
  initialTab = 'export',
}: ImportExportModalProps) {
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'export' | 'import'>(initialTab);
  const [tableCounts, setTableCounts] = useState<Record<DatabaseTableName, number>>({
    app_users: 0,
    assembly_lines: 0,
    job_cards: 0,
    stage_logs: 0,
    rework_logs: 0,
    audit_trail: 0,
  });
  const [isLoadingCounts, setIsLoadingCounts] = useState<boolean>(false);

  // Export State
  const [selectedExportTables, setSelectedExportTables] = useState<DatabaseTableName[]>([...ALL_TABLES]);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  // Import State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [selectedImportTables, setSelectedImportTables] = useState<DatabaseTableName[]>([]);
  const [importMode, setImportMode] = useState<ImportMode>('upsert');
  const [confirmReplace, setConfirmReplace] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [previewTable, setPreviewTable] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Fetch counts when opened
  useEffect(() => {
    if (isOpen) {
      loadCounts();
      setActiveTab(initialTab);
      setExportSuccessMsg(null);
      setImportResult(null);
    }
  }, [isOpen, initialTab]);

  const loadCounts = async () => {
    setIsLoadingCounts(true);
    try {
      const counts = await dataExportImportService.getTableCounts();
      setTableCounts(counts);
    } catch (e) {
      console.error('Failed to load table counts', e);
    } finally {
      setIsLoadingCounts(false);
    }
  };

  if (!isOpen) return null;

  // Toggle selection for export
  const toggleExportTable = (table: DatabaseTableName) => {
    if (selectedExportTables.includes(table)) {
      setSelectedExportTables(selectedExportTables.filter((t) => t !== table));
    } else {
      setSelectedExportTables([...selectedExportTables, table]);
    }
  };

  const handleSelectAllExport = () => {
    setSelectedExportTables([...ALL_TABLES]);
  };

  const handleDeselectAllExport = () => {
    setSelectedExportTables([]);
  };

  // Perform Export
  const handleExport = async (tablesToExport: DatabaseTableName[]) => {
    if (tablesToExport.length === 0) return;
    setIsExporting(true);
    setExportSuccessMsg(null);

    try {
      const exportPkg = await dataExportImportService.exportTables(
        tablesToExport,
        currentUser?.full_name || 'Admin User'
      );
      const isFull = tablesToExport.length === ALL_TABLES.length;
      const timestampStr = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '_');
      const filename = isFull
        ? `synchro_full_backup_${timestampStr}.json`
        : `synchro_export_${tablesToExport.join('_')}_${timestampStr}.json`;

      dataExportImportService.downloadJsonFile(exportPkg, filename);
      setExportSuccessMsg(
        `Successfully exported ${exportPkg.summary.totalRecords} records across ${tablesToExport.length} table(s) to ${filename}!`
      );
    } catch (err: any) {
      console.error('Export failed', err);
      alert(`Export error: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // File selection for Import
  const handleFileProcess = (file: File) => {
    setSelectedFile(file);
    setValidationResult(null);
    setImportResult(null);
    setImportProgress(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const validation = dataExportImportService.validateImportJson(content);
      setValidationResult(validation);

      if (validation.isValid) {
        const detectedTables = Object.keys(validation.tablesDetected) as DatabaseTableName[];
        setSelectedImportTables(detectedTables);
      }
    };
    reader.onerror = () => {
      alert('Failed to read file from disk.');
    };
    reader.readAsText(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileProcess(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.name.endsWith('.json')) {
        alert('Please drop a valid .json file.');
        return;
      }
      handleFileProcess(file);
    }
  };

  // Toggle selection for import
  const toggleImportTable = (table: DatabaseTableName) => {
    if (selectedImportTables.includes(table)) {
      setSelectedImportTables(selectedImportTables.filter((t) => t !== table));
    } else {
      setSelectedImportTables([...selectedImportTables, table]);
    }
  };

  // Perform Import
  const handleStartImport = async () => {
    if (!validationResult || !validationResult.isValid) return;
    if (selectedImportTables.length === 0) {
      alert('Please select at least one table to import.');
      return;
    }
    if (importMode === 'replace' && !confirmReplace) {
      alert('Please check the confirmation box to confirm clean replace.');
      return;
    }

    setIsImporting(true);
    setImportProgress({
      stage: 'init',
      percent: 0,
      message: 'Preparing data package for import...',
    });

    try {
      const res = await dataExportImportService.importData(
        validationResult.parsedTables,
        {
          mode: importMode,
          selectedTables: selectedImportTables,
          actorName: currentUser?.full_name || 'Admin User',
        },
        (prog) => setImportProgress(prog)
      );

      setImportResult(res);
      await loadCounts();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Import error', err);
      alert(`Import failed: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const totalCurrentRecords = Object.values(tableCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-white/15 backdrop-blur rounded-2xl text-white shadow-inner">
              <FileJson className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">Database Backup & JSON Transfer</h2>
                <span className="bg-blue-500/40 text-blue-100 text-[10px] font-mono px-2 py-0.5 rounded-full border border-blue-400/30">
                  PostgreSQL
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Export full system snapshots or manually import production data via JSON
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-5 sm:px-6 pt-3 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold border-b-2 transition ${
              activeTab === 'export'
                ? 'bg-white text-blue-700 border-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <HardDriveDownload className="w-4 h-4" />
            <span>Export Data (JSON)</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold border-b-2 transition ${
              activeTab === 'import'
                ? 'bg-white text-blue-700 border-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <HardDriveUpload className="w-4 h-4" />
            <span>Import Data (JSON)</span>
          </button>
          <div className="ml-auto text-xs text-slate-500 flex items-center space-x-1.5 pb-2 hidden sm:flex">
            <span className="font-semibold text-slate-700">Total Live Records:</span>
            <span className="bg-slate-200 text-slate-800 font-mono px-2 py-0.5 rounded-md font-bold">
              {isLoadingCounts ? '...' : totalCurrentRecords}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          
          {/* ===================== TAB 1: EXPORT ===================== */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              
              {/* Quick 1-Click Backup Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-blue-950">One-Click Full Database Snapshot</span>
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-blue-800">
                    Exports all 6 tables ({totalCurrentRecords} total records) including Job Cards, Stages, Assembly Lines, and Users into a single JSON file.
                  </p>
                </div>
                <button
                  onClick={() => handleExport(ALL_TABLES)}
                  disabled={isExporting}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 shrink-0 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExporting ? 'Generating JSON...' : 'Download Full Backup (.json)'}</span>
                </button>
              </div>

              {exportSuccessMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center space-x-2.5">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="font-medium">{exportSuccessMsg}</span>
                </div>
              )}

              {/* Custom Export Table Selection */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Custom Table Selection</h3>
                    <p className="text-xs text-slate-500">
                      Select specific tables to include in your JSON export download
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <button
                      onClick={handleSelectAllExport}
                      className="px-2.5 py-1 text-blue-600 hover:bg-blue-50 font-semibold rounded-lg transition"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      onClick={handleDeselectAllExport}
                      className="px-2.5 py-1 text-slate-500 hover:bg-slate-100 font-semibold rounded-lg transition"
                    >
                      Deselect All
                    </button>
                    <button
                      onClick={loadCounts}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                      title="Refresh row counts"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCounts ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Table Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ALL_TABLES.map((table) => {
                    const meta = TABLE_METADATA[table];
                    const Icon = TABLE_ICONS[table];
                    const isSelected = selectedExportTables.includes(table);
                    const count = tableCounts[table] || 0;

                    return (
                      <div
                        key={table}
                        onClick={() => toggleExportTable(table)}
                        className={`cursor-pointer border rounded-2xl p-3.5 transition flex items-start justify-between select-none ${
                          isSelected
                            ? 'bg-blue-50/50 border-blue-300 shadow-sm'
                            : 'bg-white border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // handled by parent div
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 pointer-events-none"
                          />
                          <div>
                            <div className="flex items-center space-x-2">
                              <Icon className="w-4 h-4 text-blue-600" />
                              <span className="font-bold text-xs sm:text-sm text-slate-900">
                                {meta.displayName}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                              {meta.description}
                            </p>
                            <span className="text-[10px] font-mono text-slate-400">
                              table: synchro_production_tracking.{table}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="inline-block bg-slate-100 text-slate-700 font-mono text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-200">
                            {isLoadingCounts ? '...' : `${count} rows`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Export Selected Button */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <div className="text-xs text-slate-500">
                    Selected:{' '}
                    <span className="font-bold text-slate-800">{selectedExportTables.length}</span> of{' '}
                    {ALL_TABLES.length} tables
                  </div>
                  <button
                    onClick={() => handleExport(selectedExportTables)}
                    disabled={selectedExportTables.length === 0 || isExporting}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-2 disabled:opacity-40"
                  >
                    <Download className="w-4 h-4" />
                    <span>
                      {isExporting ? 'Exporting...' : `Export Selected Tables (${selectedExportTables.length})`}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===================== TAB 2: IMPORT ===================== */}
          {activeTab === 'import' && (
            <div className="space-y-6">

              {/* Informational Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start space-x-3">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold">Manual JSON Data Import</span>
                  <p className="text-amber-800 leading-relaxed">
                    Upload a previously exported backup file or a valid JSON dataset. Records will be safely validated and upserted in proper relational dependency order (users & assembly lines first, then job cards, then stage logs).
                  </p>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition select-none ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/80 scale-[1.01]'
                    : 'border-slate-300 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/20'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">
                      {selectedFile ? selectedFile.name : 'Choose a JSON file or drag & drop here'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedFile
                        ? `${(selectedFile.size / 1024).toFixed(1)} KB â€¢ Click to change file`
                        : 'Supports full database backups or individual table JSON files (.json)'}
                    </p>
                  </div>
                  <span className="inline-block bg-white text-blue-600 border border-blue-200 px-4 py-1.5 rounded-xl text-xs font-semibold shadow-sm hover:bg-blue-50">
                    Browse Computer
                  </span>
                </div>
              </div>

              {/* Validation & File Analysis */}
              {validationResult && (
                <div className="space-y-4">
                  {validationResult.isValid ? (
                    <div className="bg-white border border-emerald-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                      
                      {/* File Summary Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div className="flex items-center space-x-2.5">
                          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                          <div>
                            <span className="font-bold text-sm text-slate-900">Valid JSON Backup Package</span>
                            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                              <span>Total records found: <strong className="text-slate-800">{validationResult.totalRecords}</strong></span>
                              {validationResult.metadata?.exportedAt && (
                                <span>Export date: <strong className="text-slate-800">{new Date(validationResult.metadata.exportedAt).toLocaleString()}</strong></span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Detected Tables Checkbox List */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                          <span>Tables to Import from File:</span>
                          <span>Records Detected</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {Object.entries(validationResult.tablesDetected).map(([tableName, info]) => {
                            const tableKey = tableName as DatabaseTableName;
                            const meta = TABLE_METADATA[tableKey] || { displayName: tableName, description: '' };
                            const Icon = TABLE_ICONS[tableKey] || Database;
                            const isSelected = selectedImportTables.includes(tableKey);

                            return (
                              <div
                                key={tableName}
                                onClick={() => toggleImportTable(tableKey)}
                                className={`cursor-pointer border rounded-xl p-3 flex items-center justify-between transition select-none ${
                                  isSelected
                                    ? 'bg-blue-50 border-blue-300'
                                    : 'bg-white border-slate-200 opacity-50 hover:opacity-100'
                                }`}
                              >
                                <div className="flex items-center space-x-2.5">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}}
                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 pointer-events-none"
                                  />
                                  <div>
                                    <div className="flex items-center space-x-1.5">
                                      <Icon className="w-3.5 h-3.5 text-blue-600" />
                                      <span className="font-bold text-xs text-slate-900">
                                        {meta.displayName}
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-500">
                                      {tableName}
                                    </span>
                                  </div>
                                </div>
                                <span className="bg-white border border-slate-200 font-mono text-xs font-bold px-2 py-0.5 rounded text-blue-700">
                                  {info.count} rows
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Preview Sample Accordion */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setPreviewTable(previewTable ? null : Object.keys(validationResult.tablesDetected)[0])}
                          className="w-full bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 flex items-center justify-between hover:bg-slate-100 transition"
                        >
                          <span>Preview Sample Data in File</span>
                          {previewTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {previewTable && (
                          <div className="p-3 bg-slate-50 border-t border-slate-200 text-slate-800 font-mono text-[11px] max-h-48 overflow-y-auto">
                            <pre className="whitespace-pre-wrap">
                              {JSON.stringify(
                                validationResult.parsedTables[previewTable]?.slice(0, 2),
                                null,
                                2
                              )}
                            </pre>
                          </div>
                        )}
                      </div>

                      {/* Mode Selection */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <label className="block text-xs font-bold text-slate-800">Import Mode:</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                          <label
                            className={`border rounded-xl p-3 cursor-pointer transition flex flex-col justify-between ${
                              importMode === 'upsert'
                                ? 'bg-blue-50 border-blue-400 text-blue-950 shadow-sm'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name="importMode"
                                value="upsert"
                                checked={importMode === 'upsert'}
                                onChange={() => setImportMode('upsert')}
                                className="text-blue-600 focus:ring-blue-500"
                              />
                              <span className="font-bold">Merge & Upsert</span>
                            </div>
                            <span className="text-[11px] text-slate-500 mt-1 pl-5">
                              Updates existing IDs & inserts new ones. Safe and non-destructive.
                            </span>
                          </label>

                          <label
                            className={`border rounded-xl p-3 cursor-pointer transition flex flex-col justify-between ${
                              importMode === 'append'
                                ? 'bg-blue-50 border-blue-400 text-blue-950 shadow-sm'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name="importMode"
                                value="append"
                                checked={importMode === 'append'}
                                onChange={() => setImportMode('append')}
                                className="text-blue-600 focus:ring-blue-500"
                              />
                              <span className="font-bold">Append Only</span>
                            </div>
                            <span className="text-[11px] text-slate-500 mt-1 pl-5">
                              Inserts new records; skips existing matching records.
                            </span>
                          </label>

                          <label
                            className={`border rounded-xl p-3 cursor-pointer transition flex flex-col justify-between ${
                              importMode === 'replace'
                                ? 'bg-red-50 border-red-400 text-red-950 shadow-sm'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name="importMode"
                                value="replace"
                                checked={importMode === 'replace'}
                                onChange={() => setImportMode('replace')}
                                className="text-red-600 focus:ring-red-500"
                              />
                              <span className="font-bold text-red-700">Clean Replace</span>
                            </div>
                            <span className="text-[11px] text-red-600 mt-1 pl-5">
                              Erases existing records in selected tables before inserting.
                            </span>
                          </label>
                        </div>

                        {importMode === 'replace' && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-center space-x-2.5">
                            <input
                              type="checkbox"
                              id="confirmReplaceCheck"
                              checked={confirmReplace}
                              onChange={(e) => setConfirmReplace(e.target.checked)}
                              className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-500"
                            />
                            <label htmlFor="confirmReplaceCheck" className="font-semibold cursor-pointer">
                              I understand this will delete existing data in the selected tables prior to importing.
                            </label>
                          </div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      {isImporting && importProgress && (
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <div className="flex justify-between text-xs font-semibold text-slate-700">
                            <span>{importProgress.message}</span>
                            <span>{importProgress.percent}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div
                              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                              style={{ width: `${importProgress.percent}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Import Action Button */}
                      <div className="pt-2 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null);
                            setValidationResult(null);
                          }}
                          disabled={isImporting}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                        >
                          Clear File
                        </button>
                        <button
                          type="button"
                          onClick={handleStartImport}
                          disabled={isImporting || selectedImportTables.length === 0}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition flex items-center space-x-2 disabled:opacity-50"
                        >
                          <Upload className="w-4 h-4" />
                          <span>
                            {isImporting
                              ? 'Importing Data...'
                              : `Start Import (${selectedImportTables.reduce((sum, t) => sum + (validationResult.tablesDetected[t]?.count || 0), 0)} records)`}
                          </span>
                        </button>
                      </div>

                    </div>
                  ) : (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs flex items-center space-x-2.5">
                      <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                      <div>
                        <span className="font-bold">Invalid JSON File</span>
                        <p className="mt-0.5">{validationResult.error}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Import Results Card */}
              {importResult && (
                <div
                  className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
                    importResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-amber-50 border-amber-200 text-amber-950'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    {importResult.success ? (
                      <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                    )}
                    <div>
                      <h4 className="font-bold text-sm">
                        {importResult.success
                          ? 'Data Import Completed Successfully!'
                          : 'Import Finished with Warnings'}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Processed {importResult.totalImported} records in{' '}
                        {(importResult.durationMs / 1000).toFixed(2)}s (Failed: {importResult.totalFailed})
                      </p>
                    </div>
                  </div>

                  {/* Breakdown table */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-xs">
                    {Object.entries(importResult.tableResults).map(([tName, res]) => (
                      <div
                        key={tName}
                        className="bg-white/80 p-2.5 rounded-xl border border-slate-200/60 flex items-center justify-between"
                      >
                        <span className="font-mono text-[11px] font-semibold text-slate-700">{tName}</span>
                        <span className="font-bold text-emerald-700">{res.imported} ok</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={onClose}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 rounded-xl text-xs font-bold shadow transition"
                    >
                      Done & View App Data
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 sm:px-6 py-3.5 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center space-x-1.5 font-mono text-[11px]">
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>Schema: synchro_production_tracking</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl transition shadow-sm"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
