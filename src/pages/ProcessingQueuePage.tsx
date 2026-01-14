import { Clock } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { ProcessingQueueTable } from '@/components/ProcessingQueueTable';
import { useDocuments } from '@/hooks/useDocuments';

export default function ProcessingQueuePage() {
  const { data: documents, isLoading } = useDocuments();

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-slate-600" />
            </div>
            <h1 className="text-2xl font-bold">Processing Queue</h1>
          </div>
          <p className="text-muted-foreground">
            Monitor the status of all documents in the extraction pipeline
          </p>
        </div>

        {/* Queue Table */}
        <ProcessingQueueTable documents={documents || []} isLoading={isLoading} />
      </div>
    </AppLayout>
  );
}
