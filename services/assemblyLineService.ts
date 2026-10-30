import { getBrowserSupabaseClient } from '@/lib/supabase/client';
import { AssemblyLine, ASSEMBLY_LINES } from '@/types';
import { auditService } from './auditService';

export const assemblyLineService = {
  async getAll(): Promise<AssemblyLine[]> {
    try {
      const supabase = getBrowserSupabaseClient();
      const { data, error } = await supabase
        .from('assembly_lines')
        .select('*')
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      if (error || !data || data.length === 0) {
        console.warn('Assembly lines fetch notice or empty, using defaults:', error?.message);
        return ASSEMBLY_LINES.map((name, idx) => ({
          id: `line-${idx + 1}`,
          name,
          line_code: `AL-0${idx + 1}`,
          description: 'Standard Assembly Line',
          capacity: 10,
          is_active: true,
          display_order: idx + 1,
        }));
      }

      return data as AssemblyLine[];
    } catch (err) {
      console.error('Failed to load assembly lines:', err);
      return ASSEMBLY_LINES.map((name, idx) => ({
        id: `line-${idx + 1}`,
        name,
        line_code: `AL-0${idx + 1}`,
        description: 'Standard Assembly Line',
        capacity: 10,
        is_active: true,
        display_order: idx + 1,
      }));
    }
  },

  async getActiveLines(): Promise<AssemblyLine[]> {
    const all = await this.getAll();
    return all.filter((l) => l.is_active);
  },

  async createLine(payload: {
    name: string;
    line_code?: string;
    description?: string;
    supervisor_name?: string;
    capacity?: number;
    actor_name?: string;
  }): Promise<{ success: boolean; line?: AssemblyLine; error?: string }> {
    try {
      const supabase = getBrowserSupabaseClient();
      const trimmedName = payload.name.trim();

      if (!trimmedName) {
        return { success: false, error: 'Assembly Line Name cannot be empty' };
      }

      // Check current max display order
      const existing = await this.getAll();
      const maxOrder = existing.reduce((max, l) => Math.max(max, l.display_order || 0), 0);

      const toInsert = {
        name: trimmedName,
        line_code: payload.line_code?.trim() || `AL-${String(existing.length + 1).padStart(2, '0')}`,
        description: payload.description?.trim() || 'Custom Assembly Line',
        supervisor_name: payload.supervisor_name?.trim() || 'General Supervisor',
        capacity: Number(payload.capacity) || 10,
        is_active: true,
        display_order: maxOrder + 1,
      };

      const { data, error } = await supabase
        .from('assembly_lines')
        .insert(toInsert)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Log audit
      await auditService.logAudit({
        job_card_no: 'SYSTEM',
        action: 'ASSEMBLY_LINE_CREATED',
        actor_name: payload.actor_name || 'Admin',
        actor_role: 'admin',
        details: `Created new assembly line "${trimmedName}" (Code: ${toInsert.line_code}, Capacity: ${toInsert.capacity})`,
      });

      return { success: true, line: data as AssemblyLine };
    } catch (err: any) {
      return { success: false, error: err.message || 'Unknown error' };
    }
  },

  async updateLine(
    id: string,
    updates: Partial<AssemblyLine>,
    actorName: string = 'Admin'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = getBrowserSupabaseClient();
      const { error } = await supabase
        .from('assembly_lines')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      await auditService.logAudit({
        job_card_no: 'SYSTEM',
        action: 'ASSEMBLY_LINE_UPDATED',
        actor_name: actorName,
        actor_role: 'admin',
        details: `Updated assembly line ${id}: ${JSON.stringify(updates)}`,
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async toggleActive(
    id: string,
    currentStatus: boolean,
    lineName: string,
    actorName: string = 'Admin'
  ): Promise<{ success: boolean; error?: string }> {
    return this.updateLine(
      id,
      { is_active: !currentStatus },
      actorName
    );
  },
};
