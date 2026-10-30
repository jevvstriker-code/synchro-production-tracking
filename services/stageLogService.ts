import { supabase } from '@/lib/supabase/client';
import { StageLog, PRODUCTION_STAGES } from '@/types';

export const stageLogService = {
  async getStagesForJobCard(jobCardId: string): Promise<StageLog[]> {
    const { data, error } = await supabase
      .from('stage_logs')
      .select('*')
      .eq('job_card_id', jobCardId)
      .order('stage_index', { ascending: true });

    if (error) {
      console.error(`Error fetching stages for job card ${jobCardId}:`, error);
      throw error;
    }
    return (data || []) as StageLog[];
  },

  async startStage(
    stageId: string,
    jobCardId: string,
    stageIndex: number,
    operatorName: string
  ): Promise<StageLog> {
    const now = new Date();
    const dateStr = now.toISOString().substring(0, 10);
    const timeStr = now.toTimeString().substring(0, 8);
    const startedAt = now.toISOString();

    const { data: updatedStage, error: stageErr } = await supabase
      .from('stage_logs')
      .update({
        status: 'in_progress',
        start_date: dateStr,
        start_time: timeStr,
        started_at: startedAt,
        operator_name: operatorName,
        updated_at: startedAt
      })
      .eq('id', stageId)
      .select()
      .single();

    if (stageErr || !updatedStage) {
      console.error('Error starting stage:', stageErr);
      throw stageErr;
    }

    // Update job card current_stage
    const stageName = PRODUCTION_STAGES[stageIndex]?.name || 'In Production';
    await supabase
      .from('job_cards')
      .update({
        current_stage: stageName,
        current_stage_idx: stageIndex,
        status: 'in_progress',
        updated_at: startedAt
      })
      .eq('id', jobCardId);

    return updatedStage as StageLog;
  },

  async completeStage(
    stageId: string,
    jobCardId: string,
    stageIndex: number,
    payload: {
      operatorName: string;
      delayReason?: string;
      delayNotes?: string;
    }
  ): Promise<{ updatedStage: StageLog; nextStageIndex: number; isAllComplete: boolean }> {
    const now = new Date();
    const dateStr = now.toISOString().substring(0, 10);
    const timeStr = now.toTimeString().substring(0, 8);
    const completedAt = now.toISOString();

    // Fetch existing stage to calculate elapsed time
    const { data: existing } = await supabase
      .from('stage_logs')
      .select('started_at, start_date, start_time')
      .eq('id', stageId)
      .single();

    let durationHours: number = 1.0;
    if (existing?.started_at) {
      const startMs = new Date(existing.started_at).getTime();
      const elapsedMs = now.getTime() - startMs;
      durationHours = Math.max(0.1, Number((elapsedMs / (1000 * 60 * 60)).toFixed(2)));
    } else if (existing?.start_date && existing?.start_time) {
      const startMs = new Date(`${existing.start_date}T${existing.start_time}`).getTime();
      const elapsedMs = now.getTime() - startMs;
      durationHours = Math.max(0.1, Number((elapsedMs / (1000 * 60 * 60)).toFixed(2)));
    }

    const durationDisplay = `${durationHours.toFixed(1)}h`;
    const delayReason = payload.delayReason || 'None';

    const { data: updatedStage, error: stageErr } = await supabase
      .from('stage_logs')
      .update({
        status: 'completed',
        end_date: dateStr,
        end_time: timeStr,
        completed_at: completedAt,
        duration_hours: durationHours,
        duration_display: durationDisplay,
        operator_name: payload.operatorName,
        delay_reason: delayReason,
        delay_notes: payload.delayNotes || null,
        updated_at: completedAt
      })
      .eq('id', stageId)
      .select()
      .single();

    if (stageErr || !updatedStage) {
      console.error('Error completing stage:', stageErr);
      throw stageErr;
    }

    const nextIndex = stageIndex + 1;
    const isAllComplete = nextIndex >= PRODUCTION_STAGES.length;

    if (isAllComplete) {
      await supabase
        .from('job_cards')
        .update({
          current_stage: 'Dispatched (Completed)',
          current_stage_idx: PRODUCTION_STAGES.length - 1,
          status: 'completed',
          production_end_date: dateStr,
          updated_at: completedAt
        })
        .eq('id', jobCardId);
    } else {
      const nextStageName = PRODUCTION_STAGES[nextIndex].name;
      await supabase
        .from('job_cards')
        .update({
          current_stage: nextStageName,
          current_stage_idx: nextIndex,
          status: delayReason !== 'None' ? 'delayed' : 'in_progress',
          updated_at: completedAt
        })
        .eq('id', jobCardId);
    }

    return {
      updatedStage: updatedStage as StageLog,
      nextStageIndex: nextIndex,
      isAllComplete
    };
  },

  async adminOverrideStage(
    stageId: string,
    overrideData: {
      startDate: string;
      startTime: string;
      endDate?: string;
      endTime?: string;
      durationHours?: number;
      operatorName: string;
      delayReason: string;
      adminName: string;
      reason: string;
    }
  ): Promise<StageLog> {
    const now = new Date().toISOString();
    const durationDisplay = overrideData.durationHours
      ? `${overrideData.durationHours.toFixed(1)}h`
      : undefined;

    const { data, error } = await supabase
      .from('stage_logs')
      .update({
        start_date: overrideData.startDate,
        start_time: overrideData.startTime,
        started_at: `${overrideData.startDate}T${overrideData.startTime}`,
        end_date: overrideData.endDate || null,
        end_time: overrideData.endTime || null,
        completed_at: overrideData.endDate && overrideData.endTime
          ? `${overrideData.endDate}T${overrideData.endTime}`
          : null,
        duration_hours: overrideData.durationHours,
        duration_display: durationDisplay,
        operator_name: overrideData.operatorName,
        delay_reason: overrideData.delayReason,
        is_admin_override: true,
        admin_override_reason: overrideData.reason,
        admin_override_by: overrideData.adminName,
        admin_override_at: now,
        updated_at: now
      })
      .eq('id', stageId)
      .select()
      .single();

    if (error) {
      console.error(`Error overriding stage ${stageId}:`, error);
      throw error;
    }
    return data as StageLog;
  }
};
