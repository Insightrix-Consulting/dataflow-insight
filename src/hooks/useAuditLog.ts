import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AuditLog } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';

export function useAuditLog() {
  return useQuery({
    queryKey: ['audit-log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as AuditLog[];
    }
  });
}

export function useLogAction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      action,
      entityType,
      entityId,
      details
    }: {
      action: string;
      entityType: string;
      entityId?: string;
      details?: Record<string, unknown>;
    }) => {
      const { error } = await supabase
        .from('audit_log')
        .insert([{
          user_id: user?.id ?? null,
          action,
          entity_type: entityType,
          entity_id: entityId ?? null,
          details: details as unknown as null
        }]);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-log'] });
    }
  });
}
