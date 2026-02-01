import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AlertRule {
  id: string;
  user_id: string;
  name: string;
  type: 'keyword' | 'agent' | 'submolt' | 'engagement';
  target: string;
  threshold: number | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  user_id: string;
  rule_id: string | null;
  title: string;
  message: string | null;
  severity: 'info' | 'warning' | 'critical';
  post_id: string | null;
  agent_id: string | null;
  read: boolean;
  created_at: string;
}

export interface UseAlertRulesResult {
  rules: AlertRule[];
  alerts: Alert[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
  createRule: (rule: Omit<AlertRule, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<AlertRule | null>;
  updateRule: (id: string, updates: Partial<AlertRule>) => Promise<boolean>;
  deleteRule: (id: string) => Promise<boolean>;
  markAlertRead: (id: string) => Promise<boolean>;
  markAllRead: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useAlertRules(): UseAlertRulesResult {
  const { user } = useAuth();
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setRules([]);
      setAlerts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [rulesRes, alertsRes] = await Promise.all([
        supabase
          .from('alert_rules')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('alerts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100),
      ]);

      if (rulesRes.error) throw rulesRes.error;
      if (alertsRes.error) throw alertsRes.error;

      setRules(rulesRes.data as AlertRule[]);
      setAlerts(alertsRes.data as Alert[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load alerts';
      setError(message);
      console.error('Alert rules error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createRule = useCallback(async (
    rule: Omit<AlertRule, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<AlertRule | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('alert_rules')
        .insert({
          user_id: user.id,
          name: rule.name,
          type: rule.type,
          target: rule.target,
          threshold: rule.threshold,
          enabled: rule.enabled,
        })
        .select()
        .single();

      if (error) throw error;

      const newRule = data as AlertRule;
      setRules(prev => [newRule, ...prev]);
      return newRule;
    } catch (err) {
      console.error('Failed to create rule:', err);
      return null;
    }
  }, [user]);

  const updateRule = useCallback(async (id: string, updates: Partial<AlertRule>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('alert_rules')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
      return true;
    } catch (err) {
      console.error('Failed to update rule:', err);
      return false;
    }
  }, []);

  const deleteRule = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('alert_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRules(prev => prev.filter(r => r.id !== id));
      return true;
    } catch (err) {
      console.error('Failed to delete rule:', err);
      return false;
    }
  }, []);

  const markAlertRead = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;

      setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
      return true;
    } catch (err) {
      console.error('Failed to mark alert read:', err);
      return false;
    }
  }, []);

  const markAllRead = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('alerts')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      setAlerts(prev => prev.map(a => ({ ...a, read: true })));
      return true;
    } catch (err) {
      console.error('Failed to mark all read:', err);
      return false;
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const unreadCount = alerts.filter(a => !a.read).length;

  return {
    rules,
    alerts,
    loading,
    error,
    unreadCount,
    createRule,
    updateRule,
    deleteRule,
    markAlertRead,
    markAllRead,
    refresh,
  };
}
