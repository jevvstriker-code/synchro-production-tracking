import { supabase } from '@/lib/supabase/client';
import { JobCard, StageLog, ReworkLog, PRODUCTION_STAGES, ASSEMBLY_LINES } from '@/types';

export interface OperatorPerformance {
  operatorName: string;
  totalStagesCompleted: number;
  totalHoursSpent: number;
  avgHoursPerStage: number;
  delayedStagesCount: number;
  onTimeRate: number; // percentage (0-100)
  efficiencyScore: number; // 0-100 rating
  stageBreakdown: { [stageName: string]: { count: number; avgHours: number } };
}

export const analyticsService = {
  async getDashboardAnalytics(): Promise<{
    activeCount: number;
    completedCount: number;
    delayedCount: number;
    avgCycleHours: number;
    reworkCount: number;
    delayCauses: { [reason: string]: number };
    stageVelocity: { stageName: string; completedCount: number }[];
    lineBreakdown: {
      lineName: string;
      total: number;
      active: number;
      completed: number;
      delays: number;
      efficiency: number;
    }[];
  }> {
    // 1. Fetch Job Cards
    const { data: jobCards } = await supabase.from('job_cards').select('*');
    const cards = (jobCards || []) as JobCard[];

    // 2. Fetch Stage Logs
    const { data: stageLogs } = await supabase.from('stage_logs').select('*');
    const stages = (stageLogs || []) as StageLog[];

    // 3. Fetch Rework Logs
    const { data: reworkLogs } = await supabase.from('rework_logs').select('id');
    const reworkCount = (reworkLogs || []).length;

    let activeCount = 0;
    let completedCount = 0;
    let delayedCount = 0;
    let totalHours = 0;
    let hourSamples = 0;

    cards.forEach((jc) => {
      if (jc.status === 'completed' || jc.status === 'dispatched') {
        completedCount++;
      } else {
        activeCount++;
      }
      if (jc.status === 'delayed') {
        delayedCount++;
      }
    });

    const delayCauses: { [reason: string]: number } = {};
    stages.forEach((st) => {
      if (st.delay_reason && st.delay_reason !== 'None') {
        delayCauses[st.delay_reason] = (delayCauses[st.delay_reason] || 0) + 1;
      }
      if (st.duration_hours && st.duration_hours > 0) {
        totalHours += Number(st.duration_hours);
        hourSamples++;
      }
    });

    const avgCycleHours = hourSamples > 0 ? Number((totalHours / hourSamples).toFixed(1)) : 0;

    // Stage Velocity (how many panels reached/completed each stage)
    const stageVelocity = PRODUCTION_STAGES.map((def, idx) => {
      const count = stages.filter((s) => s.stage_index === idx && s.status === 'completed').length;
      return {
        stageName: `${idx + 1}. ${def.name}`,
        completedCount: count,
      };
    });

    // 4. Fetch Active Assembly Lines
    const { data: dbLines } = await supabase
      .from('assembly_lines')
      .select('name')
      .eq('is_active', true)
      .order('display_order');

    const lineNames = (dbLines && dbLines.length > 0)
      ? dbLines.map((l: any) => l.name)
      : Array.from(new Set([...ASSEMBLY_LINES, ...cards.map((c) => c.assemblyLine || c.assembly_line)]));

    // Assembly lines breakdown
    const lineBreakdown = lineNames.map((lineName) => {
      const linePanels = cards.filter((jc) => (jc.assemblyLine || jc.assembly_line) === lineName);
      const total = linePanels.length;
      const completed = linePanels.filter((jc) => jc.status === 'completed' || jc.status === 'dispatched').length;
      const active = total - completed;
      const linePanelIds = new Set(linePanels.map((p) => p.id));
      const lineDelays = stages.filter(
        (st) => linePanelIds.has(st.job_card_id) && st.delay_reason && st.delay_reason !== 'None'
      ).length;

      const efficiency = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 100;

      return {
        lineName,
        total,
        active,
        completed,
        delays: lineDelays,
        efficiency,
      };
    });

    return {
      activeCount,
      completedCount,
      delayedCount,
      avgCycleHours,
      reworkCount,
      delayCauses,
      stageVelocity,
      lineBreakdown,
    };
  },

  async getTeamPerformanceAnalytics(): Promise<OperatorPerformance[]> {
    const { data: stageLogs } = await supabase
      .from('stage_logs')
      .select('*')
      .not('operator_name', 'is', null);

    const stages = (stageLogs || []) as StageLog[];
    const operatorMap: { [name: string]: StageLog[] } = {};

    stages.forEach((st) => {
      const name = (st.operator_name || '').trim();
      if (!name || name === '-' || name.toLowerCase() === 'unassigned') return;
      if (!operatorMap[name]) operatorMap[name] = [];
      operatorMap[name].push(st);
    });

    const results: OperatorPerformance[] = Object.entries(operatorMap).map(([operatorName, logs]) => {
      const completedLogs = logs.filter((l) => l.status === 'completed');
      const totalStagesCompleted = completedLogs.length;

      let totalHoursSpent = 0;
      let hoursCount = 0;
      let delayedStagesCount = 0;
      const stageBreakdown: { [stageName: string]: { count: number; avgHours: number } } = {};

      completedLogs.forEach((l) => {
        const hrs = Number(l.duration_hours || 0);
        if (hrs > 0) {
          totalHoursSpent += hrs;
          hoursCount++;
        }
        if (l.delay_reason && l.delay_reason !== 'None') {
          delayedStagesCount++;
        }

        if (!stageBreakdown[l.stage_name]) {
          stageBreakdown[l.stage_name] = { count: 0, avgHours: 0 };
        }
        stageBreakdown[l.stage_name].count += 1;
        stageBreakdown[l.stage_name].avgHours += hrs;
      });

      // Calculate averages per stage
      Object.keys(stageBreakdown).forEach((stName) => {
        const item = stageBreakdown[stName];
        item.avgHours = item.count > 0 ? Number((item.avgHours / item.count).toFixed(1)) : 0;
      });

      const avgHoursPerStage = hoursCount > 0 ? Number((totalHoursSpent / hoursCount).toFixed(1)) : 0;
      const onTimeRate =
        totalStagesCompleted > 0
          ? Math.max(0, Math.round(((totalStagesCompleted - delayedStagesCount) / totalStagesCompleted) * 100))
          : 100;

      // Efficiency calculation
      const efficiencyScore = Math.min(100, Math.round(onTimeRate * 0.7 + Math.min(30, totalStagesCompleted * 3)));

      return {
        operatorName,
        totalStagesCompleted,
        totalHoursSpent: Number(totalHoursSpent.toFixed(1)),
        avgHoursPerStage,
        delayedStagesCount,
        onTimeRate,
        efficiencyScore,
        stageBreakdown,
      };
    });

    // Sort by efficiency descending
    return results.sort((a, b) => b.efficiencyScore - a.efficiencyScore);
  },
};
