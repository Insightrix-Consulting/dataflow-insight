import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useSignedUrl(filePath: string | null | undefined) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!filePath) {
      setSignedUrl(null);
      return;
    }

    // Skip if it's already a full URL (legacy data)
    if (filePath.startsWith('http')) {
      setSignedUrl(filePath);
      return;
    }

    const getSignedUrl = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error: signError } = await supabase.storage
          .from('documents')
          .createSignedUrl(filePath, 3600); // 1 hour expiry

        if (signError) throw signError;
        setSignedUrl(data.signedUrl);
      } catch (err) {
        console.error('Failed to get signed URL:', err);
        setError(err instanceof Error ? err.message : 'Failed to load document');
        setSignedUrl(null);
      } finally {
        setLoading(false);
      }
    };

    getSignedUrl();
  }, [filePath]);

  return { signedUrl, loading, error };
}
