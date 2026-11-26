import { supabaseQC } from '@/lib/supabase/client';
import { QCLog, QCRecord, ReworkRecord, WeeklyObjective, QCDashboardMetrics, QCStatus, DefectType, VerificationStatus } from '@/types/qc';

function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export const qcService = {
  async getAllLogs(period?: string, startDate?: string, endDate?: string): Promise<QCLog[]> {
    let query = supabaseQC
      .from('qc_logs')
      .select(`
        *,
        qc_records (*),
        reworks (*),
        weekly_objectives (*)
      `)
      .order('entry_date', { ascending: false });

    if (startDate && endDate) {
      query = query.gte('entry_date', startDate).lte('entry_date', endDate);
    } else if (startDate) {
      query = query.gte('entry_date', startDate);
    } else if (endDate) {
      query = query.lte('entry_date', endDate);
    } else if (period && period !== 'all') {
      const now = new Date();
      const todayStr = now.toISOString().substring(0, 10);

      if (period === 'daily' || period === 'today') {
        query = query.eq('entry_date', todayStr);
      } else {
        const days = period === 'weekly' || period === '7d' ? 7 : period === 'monthly' || period === '30d' ? 30 : period === 'quarterly' || period === '90d' ? 90 : 30;
        const pastDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
        query = query.gte('entry_date', pastDate);
      }
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching QC logs:', error);
      throw error;
    }

    return (data || []).map((row: any) => ({
      ...row,
      qc_records: row.qc_records || [],
      reworks: row.reworks || [],
      weekly_objectives: row.weekly_objectives || [],
    })) as QCLog[];
  },

  async getDashboardMetrics(
    period: string = 'monthly',
    startDate?: string,
    endDate?: string
  ): Promise<QCDashboardMetrics> {
    const logs = await this.getAllLogs(period, startDate, endDate);

    let totalQCItems = 0;
    let totalDefects = 0;
    let verifiedOKCount = 0;
    let pendingDefectsCount = 0;

    const processWiseDefects: Record<string, number> = {};
    const stageWiseInspections: Record<string, number> = {};

    logs.forEach((log) => {
      (log.qc_records || []).forEach((q: QCRecord) => {
        const qty = Number(q.qty) || 1;
        totalQCItems += qty;
        const key = `${q.stage}`;
        stageWiseInspections[key] = (stageWiseInspections[key] || 0) + qty;
      });

      (log.reworks || []).forEach((rw: ReworkRecord) => {
        const qty = Number(rw.qty) || 1;
        totalDefects += qty;
        const stage = rw.stage || 'General';
        processWiseDefects[stage] = (processWiseDefects[stage] || 0) + qty;

        if (rw.verification_status === 'OK') {
          verifiedOKCount += qty;
        } else {
          pendingDefectsCount += qty;
        }
      });
    });

    const defectRate = totalQCItems > 0 ? Number(((totalDefects / totalQCItems) * 100).toFixed(1)) : 0;
    const passRate = totalQCItems > 0 ? Number((100 - defectRate).toFixed(1)) : 100;

    return {
      totalQCItems,
      totalDefects,
      defectRate,
      passRate,
      verifiedOKCount,
      pendingDefectsCount,
      processWiseDefects,
      stageWiseInspections,
      logs,
    };
  },

  async getLogById(id: string): Promise<QCLog | null> {
    const { data, error } = await supabaseQC
      .from('qc_logs')
      .select(`
        *,
        qc_records (*),
        reworks (*),
        weekly_objectives (*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;

    return {
      ...data,
      qc_records: data.qc_records || [],
      reworks: data.reworks || [],
      weekly_objectives: data.weekly_objectives || [],
    } as QCLog;
  },

  async saveLog(log: QCLog): Promise<QCLog> {
    const logId = log.id?.trim() || `synchro-entry-${Date.now()}`;

    // 1. Upsert header
    const { error: headerErr } = await supabaseQC
      .from('qc_logs')
      .upsert({
        id: logId,
        entry_date: log.entry_date,
        employee_name: log.employee_name,
        department: log.department || 'QC',
        is_weekly: Boolean(log.is_weekly),
        week_ending: log.week_ending || '',
        highlights: log.highlights || '',
        challenges: log.challenges || '',
        next_plan: log.next_plan || '',
        support: log.support || '',
        created_by: log.created_by || '',
        updated_at: new Date().toISOString(),
      });

    if (headerErr) throw new Error(`Error saving QC log header: ${headerErr.message}`);

    // 2. Clean replace children
    await supabaseQC.from('qc_records').delete().eq('log_id', logId);
    await supabaseQC.from('reworks').delete().eq('log_id', logId);
    await supabaseQC.from('weekly_objectives').delete().eq('log_id', logId);

    const idMap = new Map<string, string>();

    // 3. Insert QC Records
    if (log.qc_records && log.qc_records.length > 0) {
      const recordsToInsert = log.qc_records.map((r) => {
        const uniqueId = `rec-${generateId()}`;
        if (r.id) {
          idMap.set(r.id, uniqueId);
        }

        const validStatus: QCStatus =
          r.status === 'Rejected' ? 'Rejected' : r.status === 'Rework' ? 'Rework' : 'Accepted';

        return {
          id: uniqueId,
          log_id: logId,
          stage: r.stage || 'Final QC',
          item_name: r.item_name || 'Unnamed Panel',
          category: r.category || '',
          in_out: r.in_out || 'Indoor',
          serial_no: r.serial_no || '',
          job_card_no: r.job_card_no || r.serial_no || '',
          team_vendor: r.team_vendor || '',
          client: r.client || '',
          qty: Math.max(1, Number(r.qty) || 1),
          docs: r.docs || 'Yes',
          inspection_time: r.inspection_time || '10:00',
          status: validStatus,
          remarks: r.remarks || '',
        };
      });

      const { error: recErr } = await supabaseQC.from('qc_records').insert(recordsToInsert);
      if (recErr) throw new Error(`Error saving QC records: ${recErr.message}`);
    }

    // 4. Insert Reworks
    if (log.reworks && log.reworks.length > 0) {
      const reworksToInsert = log.reworks.map((rw) => {
        const mappedQcId = rw.qc_record_id ? idMap.get(rw.qc_record_id) || rw.qc_record_id : null;
        const validDefectType: DefectType = rw.defect_type === 'Rejected' ? 'Rejected' : 'Rework';
        const validVerif: VerificationStatus =
          rw.verification_status === 'OK' || (rw.verification_status as any) === 'Verified OK'
            ? 'OK'
            : 'Pending';

        return {
          id: `rw-${generateId()}`,
          log_id: logId,
          qc_record_id: mappedQcId,
          job_card_no: rw.job_card_no || '',
          issue_date: rw.issue_date || log.entry_date,
          item_name: rw.item_name || 'Panel Defect',
          team_vendor: rw.team_vendor || '',
          stage: rw.stage || 'Wiring',
          defect_type: validDefectType,
          qty: Math.max(1, Number(rw.qty) || 1),
          reason: rw.reason || 'Defect noted during inspection',
          root_cause: rw.root_cause || '',
          action_taken: rw.action_taken || '',
          corrective_action: rw.corrective_action || '',
          verification_status: validVerif,
        };
      });

      const { error: rwErr } = await supabaseQC.from('reworks').insert(reworksToInsert);
      if (rwErr) throw new Error(`Error saving Rework records: ${rwErr.message}`);
    }

    // 5. Insert Objectives
    if (log.is_weekly && log.weekly_objectives && log.weekly_objectives.length > 0) {
      const objectivesToInsert = log.weekly_objectives.map((o, idx) => ({
        id: generateId('obj'),
        log_id: logId,
        objective_no: o.objective_no || idx + 1,
        objective_text: o.objective_text || '',
        completed_status: o.completed_status || 'In progress',
        remarks: o.remarks || '',
      }));

      const { error: objErr } = await supabaseQC.from('weekly_objectives').insert(objectivesToInsert);
      if (objErr) throw new Error(`Error saving Weekly Objectives: ${objErr.message}`);
    }

    return this.getLogById(logId) as Promise<QCLog>;
  },

  async deleteLog(id: string): Promise<boolean> {
    await supabaseQC.from('qc_records').delete().eq('log_id', id);
    await supabaseQC.from('reworks').delete().eq('log_id', id);
    await supabaseQC.from('weekly_objectives').delete().eq('log_id', id);
    const { error } = await supabaseQC.from('qc_logs').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  async updateRework(id: string, updates: Partial<ReworkRecord>): Promise<boolean> {
    const { error } = await supabaseQC
      .from('reworks')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  async toggleReworkVerification(id: string, currentStatus: VerificationStatus): Promise<VerificationStatus> {
    const newStatus: VerificationStatus = currentStatus === 'OK' ? 'Pending' : 'OK';
    await this.updateRework(id, { verification_status: newStatus });
    return newStatus;
  },

  async getAllRegisters(period: string = 'all', startDate?: string, endDate?: string) {
    const logs = await this.getAllLogs(period, startDate, endDate);

    const allQC: (QCRecord & { log_date: string; employee_name: string; log_id: string })[] = [];
    const allReworks: (ReworkRecord & { log_date: string; employee_name: string; log_id: string })[] = [];

    logs.forEach((log) => {
      (log.qc_records || []).forEach((q) => {
        allQC.push({
          ...q,
          log_date: log.entry_date,
          employee_name: log.employee_name,
          log_id: log.id,
        });
      });

      (log.reworks || []).forEach((rw) => {
        allReworks.push({
          ...rw,
          log_date: log.entry_date,
          employee_name: log.employee_name,
          log_id: log.id,
        });
      });
    });

    return { qcRecords: allQC, reworks: allReworks, logs };
  },
};
