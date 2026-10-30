import { supabase } from '@/lib/supabase/client';
import { AuditTrail } from '@/types';

export const auditService = {
  async getAuditLogs(limit: number = 100): Promise<AuditTrail[]> {
    const { data, error } = await supabase
      .from('audit_trail')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching audit trail:', error);
      throw error;
    }
    return (data || []) as AuditTrail[];
  },

  async logAudit(entry: Omit<AuditTrail, 'id' | 'timestamp'>): Promise<AuditTrail> {
    const { data, error } = await supabase
      .from('audit_trail')
      .insert({
        ...entry,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording audit log:', error);
      throw error;
    }
    return data as AuditTrail;
  },

  async clearAuditLogs(): Promise<boolean> {
    const { error } = await supabase
      .from('audit_trail')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.error('Error clearing audit logs:', error);
      throw error;
    }
    return true;
  }
};
