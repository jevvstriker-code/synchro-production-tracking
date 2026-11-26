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
    // Sequential stage enforcement: previous stage must be completed
    if (stageIndex > 0) {
      const { data: stages } = await supabase
        .from('stage_logs')
        .select('stage_index, status, stage_name')
        .eq('job_card_id', jobCardId)
        .order('stage_index', { ascending: true });

      const prev = stages?.find((s) => s.stage_index === stageIndex - 1);
      if (prev && prev.status !== 'completed') {
        throw new Error(
          `Sequential Stage Rule: Stage ${stageIndex} (${prev.stage_name}) must be completed before starting this stage.`
        );
      }
    }

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
        is_timer_paused: false,
        accumulated_seconds: 0,
        last_resumed_at: startedAt,
        updated_at: startedAt,
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
        updated_at: startedAt,
      })
      .eq('id', jobCardId);

    return updatedStage as StageLog;
  },

  async pauseStageTimer(stageId: string): Promise<StageLog> {
    const now = new Date();
    const { data: existing } = await supabase
      .from('stage_logs')
      .select('accumulated_seconds, last_resumed_at, is_timer_paused')
      .eq('id', stageId)
      .single();

    let newAccumulated = existing?.accumulated_seconds || 0;
    if (!existing?.is_timer_paused && existing?.last_resumed_at) {
      const elapsed = Math.max(0, Math.floor((now.getTime() - new Date(existing.last_resumed_at).getTime()) / 1000));
      newAccumulated += elapsed;
    }

    const { data: updated, error } = await supabase
      .from('stage_logs')
      .update({
        is_timer_paused: true,
        accumulated_seconds: newAccumulated,
        last_resumed_at: null,
        updated_at: now.toISOString(),
      })
      .eq('id', stageId)
      .select()
      .single();

    if (error || !updated) {
      throw error || new Error('Failed to pause timer');
    }
    return updated as StageLog;
  },

  async resumeStageTimer(stageId: string): Promise<StageLog> {
    const now = new Date();
    const { data: updated, error } = await supabase
      .from('stage_logs')
      .update({
        is_timer_paused: false,
        last_resumed_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', stageId)
      .select()
      .single();

    if (error || !updated) {
      throw error || new Error('Failed to resume timer');
    }
    return updated as StageLog;
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
    // Sequential stage enforcement: previous stage must be completed
    if (stageIndex > 0) {
      const { data: stages } = await supabase
        .from('stage_logs')
        .select('stage_index, status, stage_name')
        .eq('job_card_id', jobCardId)
        .order('stage_index', { ascending: true });

      const prev = stages?.find((s) => s.stage_index === stageIndex - 1);
      if (prev && prev.status !== 'completed') {
        throw new Error(
          `Sequential Stage Rule: Stage ${stageIndex} (${prev.stage_name}) must be completed before completing this stage.`
        );
      }
    }

    const now = new Date();
    const dateStr = now.toISOString().substring(0, 10);
    const timeStr = now.toTimeString().substring(0, 8);
    const completedAt = now.toISOString();

    // Fetch existing stage to calculate active elapsed working time
    const { data: existing } = await supabase
      .from('stage_logs')
      .select('started_at, start_date, start_time, accumulated_seconds, last_resumed_at, is_timer_paused')
      .eq('id', stageId)
      .single();

    let totalSeconds = existing?.accumulated_seconds || 0;
    if (!existing?.is_timer_paused && existing?.last_resumed_at) {
      const elapsed = Math.max(0, Math.floor((now.getTime() - new Date(existing.last_resumed_at).getTime()) / 1000));
      totalSeconds += elapsed;
    } else if (totalSeconds === 0 && existing?.started_at) {
      const startMs = new Date(existing.started_at).getTime();
      totalSeconds = Math.max(60, Math.floor((now.getTime() - startMs) / 1000));
    }

    const durationHours = Math.max(0.1, Number((totalSeconds / 3600).toFixed(2)));
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
        accumulated_seconds: totalSeconds,
        is_timer_paused: false,
        last_resumed_at: null,
        operator_name: payload.operatorName,
        delay_reason: delayReason,
        delay_notes: payload.delayNotes || null,
        updated_at: completedAt,
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
