import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Extract file path from a full Supabase storage URL
function extractFilePath(url: string): string | null {
  // Match URLs like: https://xxx.supabase.co/storage/v1/object/public/documents/filename.pdf
  // or: https://xxx.supabase.co/storage/v1/object/sign/documents/filename.pdf
  const match = url.match(/\/storage\/v1\/object\/(?:public|sign)\/documents\/(.+?)(?:\?|$)/);
  if (match) {
    return match[1];
  }
  return null;
}

export function useSignedUrl(filePath: string | null | undefined) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!filePath) {
      setSignedUrl(null);
      return;
    }

    const getSignedUrl = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Determine the actual file path
        let actualPath = filePath;
        
        // If it's a full URL, extract the file path
        if (filePath.startsWith('http')) {
          const extracted = extractFilePath(filePath);
          if (!extracted) {
            throw new Error('Could not extract file path from URL');
          }
          actualPath = extracted;
        }

        const { data, error: signError } = await supabase.storage
          .from('documents')
          .createSignedUrl(actualPath, 3600); // 1 hour expiry

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
