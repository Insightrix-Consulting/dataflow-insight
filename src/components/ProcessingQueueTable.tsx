import { format } from 'date-fns';
import { Clock, RefreshCw, Loader2 } from 'lucide-react';
import { Document } from '@/types/database';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfidenceBadge } from '@/components/ConfidenceBadge';
import { Button } from '@/components/ui/button';
import { useRetryExtraction } from '@/hooks/useDocuments';
import { useAuth } from '@/contexts/AuthContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ProcessingQueueTableProps {
  documents: Document[];
  isLoading?: boolean;
}

export function ProcessingQueueTable({ documents, isLoading }: ProcessingQueueTableProps) {
  const retryExtraction = useRetryExtraction();
  const { canEdit } = useAuth();

  if (isLoading) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="p-8 text-center text-muted-foreground">
          Loading processing queue...
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="p-8 text-center text-muted-foreground">
          No documents in the processing queue.
        </div>
      </div>
    );
  }

  const getProcessingStep = (status: string) => {
    switch (status) {
      case 'uploaded':
        return 'Waiting to process';
      case 'processing':
        return 'AI extracting data...';
      case 'needs_review':
        return 'Awaiting human review';
      case 'approved':
        return 'Complete';
      case 'failed':
        return 'Processing failed';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table className="data-table">
        <TableHeader>
          <TableRow>
            <TableHead>Filename</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Processing Step</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>Uploaded</TableHead>
            {canEdit && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell className="font-medium">{doc.filename}</TableCell>
              <TableCell className="capitalize">{doc.document_type}</TableCell>
              <TableCell>
                <StatusBadge status={doc.status} />
              </TableCell>
              <TableCell>
                <span className={doc.status === 'processing' ? 'flex items-center gap-2' : ''}>
                  {doc.status === 'processing' && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  {getProcessingStep(doc.status)}
                </span>
              </TableCell>
              <TableCell>
                <ConfidenceBadge confidence={doc.overall_confidence} showLabel={false} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(doc.uploaded_at), 'MMM d, yyyy HH:mm')}
              </TableCell>
              {canEdit && (
                <TableCell className="text-right">
                  {(doc.status === 'failed' || doc.status === 'uploaded') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => retryExtraction.mutate(doc.id)}
                      disabled={retryExtraction.isPending}
                    >
                      <RefreshCw className={`h-4 w-4 mr-1 ${retryExtraction.isPending ? 'animate-spin' : ''}`} />
                      Retry
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
