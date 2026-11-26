import { supabase } from '@/lib/supabase/client';
import { ApprovalRequest, ApprovalRequestStatus } from '@/types';
import { stageLogService } from '@/services/stageLogService';
import { auditService } from '@/services/auditService';

export const approvalService = {
  async getPendingRequests(): Promise<ApprovalRequest[]> {
    const { data, error } = await supabase
      .from('approval_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending approval requests:', error);
      throw error;
    }
    return (data || []) as ApprovalRequest[];
  },

  async getAllRequests(limit: number = 50): Promise<ApprovalRequest[]> {
    const { data, error } = await supabase
      .from('approval_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching all approval requests:', error);
      throw error;
    }
    return (data || []) as ApprovalRequest[];
  },

  async createRequest(payload: {
    request_type: ApprovalRequest['request_type'];
    job_card_no: string;
    panel_name?: string;
    stage_name?: string;
    requester_name: string;
    requester_role: string;
    requester_id?: string;
    action_payload: any;
  }): Promise<ApprovalRequest> {
    const { data, error } = await supabase
      .from('approval_requests')
      .insert({
        request_type: payload.request_type,
        job_card_no: payload.job_card_no,
        panel_name: payload.panel_name || null,
        stage_name: payload.stage_name || null,
        requester_name: payload.requester_name,
        requester_role: payload.requester_role,
        requester_id: payload.requester_id || null,
        action_payload: payload.action_payload,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating approval request:', error);
      throw error;
    }

    // Log to audit trail that a change request was submitted
    try {
      await auditService.logAudit({
        job_card_no: payload.job_card_no,
        action: `Approval Requested: ${payload.request_type}`,
        actor_name: payload.requester_name,
        actor_role: payload.requester_role,
        details: `Stage/Panel: ${payload.stage_name || payload.panel_name || 'N/A'} (Awaiting Admin Review)`,
      });
    } catch (e) {
      console.warn('Could not audit approval submission', e);
    }

    return data as ApprovalRequest;
  },

  async approveRequest(requestId: string, adminName: string, adminNotes?: string): Promise<boolean> {
    // 1. Fetch request
    const { data: req, error: fetchErr } = await supabase
      .from('approval_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchErr || !req) {
      throw new Error(`Approval request not found: ${fetchErr?.message}`);
    }

    const payload = req.action_payload;

    // 2. Execute the underlying action
    if (req.request_type === 'stage_update') {
      const { stageId, stageIndex, status, operatorName, delayReason, delayNotes, startDate, startTime, endDate, endTime, durationHours, jobCardId } = payload;
      
      const updateData: any = {
        status: status || 'completed',
        operator_name: operatorName,
        delay_reason: delayReason || 'None',
        delay_notes: delayNotes || null,
        updated_at: new Date().toISOString(),
      };

      if (startDate) updateData.start_date = startDate;
      if (startTime) updateData.start_time = startTime;
      if (endDate) updateData.end_date = endDate;
      if (endTime) updateData.end_time = endTime;
      if (durationHours !== undefined) {
        updateData.duration_hours = durationHours;
        updateData.duration_display = `${durationHours}h`;
      }

      const { error: stageErr } = await supabase
        .from('stage_logs')
        .update(updateData)
        .eq('id', stageId);

      if (stageErr) throw stageErr;

      // Advance job card if completed
      if (status === 'completed' && jobCardId) {
        const nextIdx = Number(stageIndex) + 1;
        const isDispatched = nextIdx >= 11;
        await supabase
          .from('job_cards')
          .update({
            current_stage_idx: Math.min(nextIdx, 10),
            status: isDispatched ? 'dispatched' : 'in_progress',
            production_end_date: isDispatched ? new Date().toISOString().substring(0, 10) : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', jobCardId);
      }
    } else if (req.request_type === 'job_card_create') {
      const { error: jcErr } = await supabase
        .from('job_cards')
        .insert(payload);
      if (jcErr) throw jcErr;
    } else if (req.request_type === 'rework_log') {
      const { error: rwErr } = await supabase
        .from('rework_logs')
        .insert(payload);
      if (rwErr) throw rwErr;
    } else if (req.request_type === 'panel_assign') {
      const { jobCardId, assemblyLine } = payload;
      const { error: asErr } = await supabase
        .from('job_cards')
        .update({ assembly_line: assemblyLine, updated_at: new Date().toISOString() })
        .eq('id', jobCardId);
      if (asErr) throw asErr;
    }

    // 3. Mark request as approved
    const { error: upErr } = await supabase
      .from('approval_requests')
      .update({
        status: 'approved',
        admin_notes: adminNotes || 'Approved by Admin Manager',
        reviewed_by: adminName,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (upErr) throw upErr;

    // 4. Log to audit trail
    await auditService.logAudit({
      job_card_no: req.job_card_no,
      action: `Admin Manager Approved: ${req.request_type}`,
      actor_name: adminName,
      actor_role: 'admin',
      details: `Approved changes submitted by ${req.requester_name} (${req.requester_role}). Notes: ${adminNotes || 'None'}`,
    });

    return true;
  },

  async rejectRequest(requestId: string, adminName: string, adminNotes?: string): Promise<boolean> {
    const { data: req, error: fetchErr } = await supabase
      .from('approval_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchErr || !req) {
      throw new Error(`Approval request not found: ${fetchErr?.message}`);
    }

    const { error } = await supabase
      .from('approval_requests')
      .update({
        status: 'rejected',
        admin_notes: adminNotes || 'Rejected by Admin Manager',
        reviewed_by: adminName,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (error) throw error;

    await auditService.logAudit({
      job_card_no: req.job_card_no,
      action: `Admin Manager Rejected: ${req.request_type}`,
      actor_name: adminName,
      actor_role: 'admin',
      details: `Rejected changes from ${req.requester_name} (${req.requester_role}). Reason: ${adminNotes || 'Declined'}`,
    });

    return true;
  },
};
