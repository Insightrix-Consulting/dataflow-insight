import { format } from 'date-fns';
import { Document } from '@/types/database';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfidenceBadge } from '@/components/ConfidenceBadge';
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
        return 'Extracting data...';
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
              <TableCell className="text-muted-foreground">
                {getProcessingStep(doc.status)}
              </TableCell>
              <TableCell>
                <ConfidenceBadge confidence={doc.overall_confidence} showLabel={false} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(doc.uploaded_at), 'MMM d, yyyy HH:mm')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
