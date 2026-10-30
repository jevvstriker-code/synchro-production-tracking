import { supabase } from '@/lib/supabase/client';
import { AppUser } from '@/types';

export const userService = {
  async getAllUsers(): Promise<AppUser[]> {
    const { data, error } = await supabase
      .from('app_users')
      .select('id, username, full_name, role, pin_code, phone, is_active, created_at, updated_at')
      .order('role', { ascending: true })
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
    return (data || []) as AppUser[];
  },

  async authenticate(identifier: string, secret?: string): Promise<AppUser | null> {
    const cleanId = identifier.trim();
    const cleanSecret = (secret || '').trim();

    // 1. Try PIN authentication first (fast mobile phone login)
    if (!cleanSecret || cleanSecret === cleanId) {
      const { data: byPin } = await supabase
        .from('app_users')
        .select('*')
        .eq('pin_code', cleanId)
        .eq('is_active', true)
        .limit(1);

      if (byPin && byPin.length > 0) {
        return byPin[0] as AppUser;
      }
    }

    // 2. Try Username + Password or Username + PIN
    const { data: byUser } = await supabase
      .from('app_users')
      .select('*')
      .eq('username', cleanId.toLowerCase())
      .eq('is_active', true)
      .limit(1);

    if (byUser && byUser.length > 0) {
      const user = byUser[0];
      if (cleanSecret && (user.password === cleanSecret || user.pin_code === cleanSecret)) {
        return user as AppUser;
      }
    }

    // 3. Fallback check by Full Name match
    const { data: byName } = await supabase
      .from('app_users')
      .select('*')
      .ilike('full_name', cleanId)
      .eq('is_active', true)
      .limit(1);

    if (byName && byName.length > 0) {
      const user = byName[0];
      if (cleanSecret && (user.password === cleanSecret || user.pin_code === cleanSecret)) {
        return user as AppUser;
      }
    }

    return null;
  },

  async createUser(payload: {
    username: string;
    full_name: string;
    role: AppUser['role'];
    pin_code: string;
    password?: string;
    phone?: string;
  }): Promise<AppUser> {
    const { data, error } = await supabase
      .from('app_users')
      .insert({
        username: payload.username.toLowerCase().trim(),
        full_name: payload.full_name.trim(),
        role: payload.role,
        pin_code: payload.pin_code.trim(),
        password: payload.password || payload.pin_code,
        phone: payload.phone || null,
        is_active: true
      })
      .select('id, username, full_name, role, pin_code, phone, is_active, created_at, updated_at')
      .single();

    if (error) {
      console.error('Error creating user:', error);
      throw error;
    }
    return data as AppUser;
  },

  async updateUser(id: string, updates: Partial<AppUser>): Promise<AppUser> {
    const { data, error } = await supabase
      .from('app_users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, username, full_name, role, pin_code, phone, is_active, created_at, updated_at')
      .single();

    if (error) {
      console.error(`Error updating user ${id}:`, error);
      throw error;
    }
    return data as AppUser;
  },

  async toggleUserStatus(id: string, isActive: boolean): Promise<boolean> {
    const { error } = await supabase
      .from('app_users')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error(`Error updating user status ${id}:`, error);
      throw error;
    }
    return true;
  },

  async deleteUser(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('app_users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
    return true;
  }
};
