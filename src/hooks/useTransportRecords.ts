import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TransportRecord } from '@/types/database';

export function useTransportRecords() {
  return useQuery({
    queryKey: ['transport-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transport_records')
        .select('*')
        .order('receipt_created_date', { ascending: false });
      
      if (error) throw error;
      return data as TransportRecord[];
    }
  });
}
