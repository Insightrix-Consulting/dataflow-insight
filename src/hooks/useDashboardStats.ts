import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardStats } from '@/types/database';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const { data: documents, error } = await supabase
        .from('documents')
        .select('status, overall_confidence');

      if (error) throw error;

      const documentsUploaded = documents.length;
      const documentsProcessed = documents.filter(
        d => d.status === 'approved' || d.status === 'needs_review'
      ).length;
      const documentsNeedingReview = documents.filter(
        d => d.status === 'needs_review'
      ).length;
      
      const confidenceScores = documents
        .filter(d => d.overall_confidence !== null)
        .map(d => d.overall_confidence as number);
      
      const averageConfidence = confidenceScores.length > 0
        ? Math.round(confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length)
        : 0;

      return {
        documentsUploaded,
        documentsProcessed,
        documentsNeedingReview,
        averageConfidence
      };
    }
  });
}
