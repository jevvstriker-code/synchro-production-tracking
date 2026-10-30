import { supabase } from '@/lib/supabase/client';
import { JobCard, StageLog, PRODUCTION_STAGES } from '@/types';

export const jobCardService = {
  async getAllJobCards(): Promise<JobCard[]> {
    const { data, error } = await supabase
      .from('job_cards')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching job cards:', error);
      throw error;
    }
    return (data || []).map((d: any) => ({
      ...d,
      assemblyLine: d.assembly_line,
    })) as JobCard[];
  },

  async getJobCardByNo(jcNo: string): Promise<JobCard | null> {
    const { data, error } = await supabase
      .from('job_cards')
      .select('*')
      .eq('job_card_no', jcNo)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // not found
      console.error(`Error fetching job card ${jcNo}:`, error);
      throw error;
    }
    return {
      ...data,
      assemblyLine: data.assembly_line,
    } as JobCard;
  },

  async getJobCardWithStages(jcNo: string): Promise<{ jobCard: JobCard; stages: StageLog[] } | null> {
    const jobCard = await this.getJobCardByNo(jcNo);
    if (!jobCard) return null;

    const { data: stages, error } = await supabase
      .from('stage_logs')
      .select('*')
      .eq('job_card_id', jobCard.id)
      .order('stage_index', { ascending: true });

    if (error) {
      console.error(`Error fetching stages for ${jcNo}:`, error);
      throw error;
    }

    return {
      jobCard,
      stages: (stages || []) as StageLog[]
    };
  },

  async createJobCard(payload: Omit<JobCard, 'id' | 'created_at' | 'updated_at' | 'current_stage_idx' | 'assemblyLine'> & { assemblyLine?: string }): Promise<JobCard> {
    const { assemblyLine, ...dbData } = payload;
    const { data: inserted, error: jcError } = await supabase
      .from('job_cards')
      .insert({
        ...dbData,
        assembly_line: payload.assembly_line || assemblyLine || 'Assembly Line 1',
        current_stage: PRODUCTION_STAGES[0].name,
        current_stage_idx: 0,
        status: 'in_progress',
      })
      .select()
      .single();

    if (jcError || !inserted) {
      console.error('Error creating job card:', jcError);
      throw jcError;
    }

    // Automatically create 11 stage records
    const stageInserts = PRODUCTION_STAGES.map((stage, idx) => ({
      job_card_id: inserted.id,
      stage_index: idx,
      stage_name: stage.name,
      status: idx === 0 ? 'pending' : 'pending',
      delay_reason: 'None',
    }));

    const { error: stageError } = await supabase
      .from('stage_logs')
      .insert(stageInserts);

    if (stageError) {
      console.error('Error generating stage records for job card:', stageError);
    }

    return {
      ...inserted,
      assemblyLine: inserted.assembly_line,
    } as JobCard;
  },

  async updateJobCard(id: string, updates: Partial<JobCard>): Promise<JobCard> {
    const { data, error } = await supabase
      .from('job_cards')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating job card ${id}:`, error);
      throw error;
    }
    return data as JobCard;
  },

  async deleteJobCard(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('job_cards')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting job card ${id}:`, error);
      throw error;
    }
    return true;
  }
};
