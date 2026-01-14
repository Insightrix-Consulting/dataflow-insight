import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Document, DocumentStatus, DocumentType } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export function useDocuments() {
  return useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('uploaded_at', { ascending: false });
      
      if (error) throw error;
      return data as Document[];
    }
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: ['documents', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Document;
    },
    enabled: !!id
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ file, documentType }: { file: File; documentType: DocumentType }) => {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Create document record
      const { data, error } = await supabase
        .from('documents')
        .insert({
          filename: file.name,
          file_url: urlData.publicUrl,
          document_type: documentType,
          status: 'uploaded' as DocumentStatus
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger extraction for energy documents
      if (documentType === 'energy') {
        // Don't await - let it process in background
        supabase.functions.invoke('extract-energy-invoice', {
          body: { document_id: data.id }
        }).then(({ error: extractError }) => {
          if (extractError) {
            console.error('Extraction failed:', extractError);
            // Update document status to failed
            supabase
              .from('documents')
              .update({ status: 'failed' as DocumentStatus })
              .eq('id', data.id);
          }
          // Refresh data after extraction
          queryClient.invalidateQueries({ queryKey: ['documents'] });
          queryClient.invalidateQueries({ queryKey: ['energy-invoices'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        });
      }

      return data as Document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: 'Document uploaded',
        description: 'Your document has been uploaded and is being processed by AI.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
}

export function useUpdateDocumentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: DocumentStatus }) => {
      const { data, error } = await supabase
        .from('documents')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['energy-invoices'] });
    }
  });
}

export function useRetryExtraction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (documentId: string) => {
      // Reset status to processing
      await supabase
        .from('documents')
        .update({ status: 'processing' as DocumentStatus })
        .eq('id', documentId);

      // Trigger extraction
      const { data, error } = await supabase.functions.invoke('extract-energy-invoice', {
        body: { document_id: documentId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['energy-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: 'Extraction started',
        description: 'The document is being reprocessed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Extraction failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
}
