import { supabase } from '@/lib/supabase/client';
import { ReworkLog } from '@/types';

export const reworkService = {
  async getAllReworkLogs(): Promise<ReworkLog[]> {
    const { data, error } = await supabase
      .from('rework_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching rework logs:', error);
      throw error;
    }
    return (data || []) as ReworkLog[];
  },

  async createReworkLog(log: Omit<ReworkLog, 'id' | 'created_at'>): Promise<ReworkLog> {
    const { data, error } = await supabase
      .from('rework_logs')
      .insert({
        ...log,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating rework log:', error);
      throw error;
    }
    return data as ReworkLog;
  },

  async deleteReworkLog(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('rework_logs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting rework log ${id}:`, error);
      throw error;
    }
    return true;
  }
};
