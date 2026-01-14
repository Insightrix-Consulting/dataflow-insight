import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EnergyInvoice, ReadingType } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function useEnergyInvoices() {
  return useQuery({
    queryKey: ['energy-invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('energy_invoices')
        .select(`
          *,
          document:documents(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as EnergyInvoice[];
    }
  });
}

export function useEnergyInvoice(id: string) {
  return useQuery({
    queryKey: ['energy-invoices', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('energy_invoices')
        .select(`
          *,
          document:documents(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as EnergyInvoice;
    },
    enabled: !!id
  });
}

export function useUpdateEnergyInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<{
        invoice_date: string;
        billing_period_start: string;
        billing_period_end: string;
        reading_type: ReadingType;
        kwh_used: number;
        reviewer_notes: string;
      }> 
    }) => {
      const { data, error } = await supabase
        .from('energy_invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as EnergyInvoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['energy-invoices'] });
      toast({
        title: 'Invoice updated',
        description: 'The invoice has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
}

export function useApproveInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      // Get the invoice first
      const { data: invoice, error: fetchError } = await supabase
        .from('energy_invoices')
        .select('document_id')
        .eq('id', invoiceId)
        .single();

      if (fetchError) throw fetchError;

      // Update invoice
      const { error: invoiceError } = await supabase
        .from('energy_invoices')
        .update({
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          confidence_invoice_date: 100,
          confidence_reading_type: 100,
          confidence_kwh: 100
        })
        .eq('id', invoiceId);

      if (invoiceError) throw invoiceError;

      // Update document status
      const { error: docError } = await supabase
        .from('documents')
        .update({
          status: 'approved',
          overall_confidence: 100
        })
        .eq('id', invoice.document_id);

      if (docError) throw docError;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['energy-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: 'Invoice approved',
        description: 'The invoice has been approved and marked as verified.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Approval failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
}
